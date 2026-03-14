from __future__ import annotations

import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    Document,
    DocumentListResponse,
    HealthResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    SourceReference,
)
from app.services.chat_service import ChatService
from app.services.document_processor import DocumentProcessor
from app.services.embeddings import EmbeddingsService
from app.services.storage import StorageService

logger = structlog.get_logger(__name__)

router = APIRouter()


# --------------------------------------------------------------------------- #
#  Health
# --------------------------------------------------------------------------- #

@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    return HealthResponse()


# --------------------------------------------------------------------------- #
#  Chat
# --------------------------------------------------------------------------- #

@router.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat(request: Request, body: ChatRequest) -> ChatResponse:
    """RAG-powered DevOps Q&A endpoint."""
    chat_svc: ChatService = request.app.state.chat
    try:
        return await chat_svc.ask(body)
    except Exception as exc:
        logger.exception("chat_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {exc}",
        ) from exc


# --------------------------------------------------------------------------- #
#  Documents - Upload
# --------------------------------------------------------------------------- #

@router.post(
    "/documents/upload",
    response_model=Document,
    status_code=status.HTTP_201_CREATED,
    tags=["documents"],
)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("general"),
    tags: str = Form(""),
) -> Document:
    """Upload a document, process and embed it."""
    storage: StorageService = request.app.state.storage
    embeddings: EmbeddingsService = request.app.state.embeddings
    processor: DocumentProcessor = request.app.state.processor

    file_bytes = await file.read()
    file_size = len(file_bytes)
    filename = file.filename or "unknown"

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    doc = Document(
        id=str(uuid.uuid4()),
        title=title,
        filename=filename,
        category=category,
        tags=tag_list,
        file_size=file_size,
    )

    try:
        # 1. Save metadata record
        await storage.create_document(doc)

        # 2. Extract text & chunk
        chunks, metadatas = await processor.process(
            file_bytes=file_bytes,
            filename=filename,
            document_id=doc.id,
            category=category,
            tags=tag_list,
        )

        # 3. Embed & store vectors
        chunk_count = await embeddings.store_document_chunks(
            document_id=doc.id,
            document_title=doc.title,
            chunks=chunks,
            metadatas=metadatas,
        )

        # 4. Update chunk count
        doc.chunk_count = chunk_count
        await storage.update_chunk_count(doc.id, chunk_count)

        logger.info(
            "document_uploaded",
            document_id=doc.id,
            filename=filename,
            chunks=chunk_count,
        )
        return doc

    except ValueError as exc:
        # Clean up the metadata row on processing failure
        await storage.delete_document(doc.id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        await storage.delete_document(doc.id)
        logger.exception("upload_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload processing failed: {exc}",
        ) from exc


# --------------------------------------------------------------------------- #
#  Documents - List
# --------------------------------------------------------------------------- #

@router.get("/documents", response_model=DocumentListResponse, tags=["documents"])
async def list_documents(
    request: Request,
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> DocumentListResponse:
    storage: StorageService = request.app.state.storage
    docs, total = await storage.list_documents(
        category=category, limit=limit, offset=offset
    )
    return DocumentListResponse(documents=docs, total=total)


# --------------------------------------------------------------------------- #
#  Documents - Categories  (MUST be before /{document_id} to avoid capture)
# --------------------------------------------------------------------------- #

@router.get(
    "/documents/categories",
    response_model=list[str],
    tags=["documents"],
)
async def list_categories(request: Request) -> list[str]:
    storage: StorageService = request.app.state.storage
    return await storage.list_categories()


# --------------------------------------------------------------------------- #
#  Documents - Semantic search  (MUST be before /{document_id} to avoid capture)
# --------------------------------------------------------------------------- #

@router.post(
    "/documents/search",
    response_model=SemanticSearchResponse,
    tags=["documents"],
)
async def semantic_search(
    request: Request, body: SemanticSearchRequest
) -> SemanticSearchResponse:
    embeddings: EmbeddingsService = request.app.state.embeddings

    results = await embeddings.search_similar(
        query=body.query,
        k=body.k,
        category=body.category,
    )

    sources = [
        SourceReference(
            document_title=r.get("document_title", "Unknown"),
            content_preview=r.get("content", "")[:300],
            relevance_score=round(float(r.get("similarity", 0.0)), 4),
            chunk_id=r.get("id", ""),
        )
        for r in results
    ]

    return SemanticSearchResponse(results=sources)


# --------------------------------------------------------------------------- #
#  Documents - Get by ID
# --------------------------------------------------------------------------- #

@router.get("/documents/{document_id}", response_model=Document, tags=["documents"])
async def get_document(request: Request, document_id: str) -> Document:
    storage: StorageService = request.app.state.storage
    doc = await storage.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )
    return doc


# --------------------------------------------------------------------------- #
#  Documents - Delete
# --------------------------------------------------------------------------- #

@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["documents"],
)
async def delete_document(request: Request, document_id: str) -> None:
    storage: StorageService = request.app.state.storage
    embeddings: EmbeddingsService = request.app.state.embeddings

    doc = await storage.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found.",
        )

    await embeddings.delete_document_chunks(document_id)
    await storage.delete_document(document_id)
    logger.info("document_fully_deleted", document_id=document_id)
