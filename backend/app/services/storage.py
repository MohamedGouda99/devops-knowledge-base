from __future__ import annotations

from typing import Any, Optional

import structlog
from supabase import Client as SupabaseClient

from app.models.schemas import Document

logger = structlog.get_logger(__name__)


class StorageService:
    """CRUD operations for the ``documents`` table in Supabase."""

    def __init__(self, supabase: SupabaseClient) -> None:
        self._supabase = supabase

    # ------------------------------------------------------------------ #
    #  Create
    # ------------------------------------------------------------------ #

    async def create_document(self, doc: Document) -> Document:
        """Insert a new document record and return it."""
        row = {
            "id": doc.id,
            "title": doc.title,
            "filename": doc.filename,
            "category": doc.category,
            "tags": doc.tags,
            "chunk_count": doc.chunk_count,
            "file_size": doc.file_size,
            "created_at": doc.created_at.isoformat(),
        }
        response = self._supabase.table("documents").insert(row).execute()
        logger.info("document_created", document_id=doc.id, title=doc.title)
        return Document(**response.data[0])

    # ------------------------------------------------------------------ #
    #  Read
    # ------------------------------------------------------------------ #

    async def get_document(self, document_id: str) -> Optional[Document]:
        """Fetch a single document by *document_id*."""
        response = (
            self._supabase.table("documents")
            .select("*")
            .eq("id", document_id)
            .execute()
        )
        if not response.data:
            return None
        return Document(**response.data[0])

    async def list_documents(
        self,
        category: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[Document], int]:
        """Return a paginated list of documents, optionally filtered by *category*.

        Returns ``(documents, total_count)``.
        """
        query = self._supabase.table("documents").select("*", count="exact")

        if category:
            query = query.eq("category", category)

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        response = query.execute()

        docs = [Document(**row) for row in (response.data or [])]
        total = response.count if response.count is not None else len(docs)

        logger.info(
            "documents_listed",
            category=category,
            returned=len(docs),
            total=total,
        )
        return docs, total

    # ------------------------------------------------------------------ #
    #  Update
    # ------------------------------------------------------------------ #

    async def update_chunk_count(self, document_id: str, chunk_count: int) -> None:
        """Update the chunk_count for a processed document."""
        self._supabase.table("documents").update(
            {"chunk_count": chunk_count}
        ).eq("id", document_id).execute()
        logger.info(
            "chunk_count_updated",
            document_id=document_id,
            chunk_count=chunk_count,
        )

    # ------------------------------------------------------------------ #
    #  Delete
    # ------------------------------------------------------------------ #

    async def delete_document(self, document_id: str) -> bool:
        """Delete the document record. Returns ``True`` if a row was removed."""
        response = (
            self._supabase.table("documents")
            .delete()
            .eq("id", document_id)
            .execute()
        )
        deleted = bool(response.data)
        logger.info(
            "document_deleted",
            document_id=document_id,
            success=deleted,
        )
        return deleted

    # ------------------------------------------------------------------ #
    #  Categories
    # ------------------------------------------------------------------ #

    async def list_categories(self) -> list[str]:
        """Return a sorted list of unique document categories."""
        response = (
            self._supabase.table("documents")
            .select("category")
            .execute()
        )
        categories: set[str] = set()
        for row in response.data or []:
            cat = row.get("category")
            if cat:
                categories.add(cat)

        result = sorted(categories)
        logger.info("categories_listed", count=len(result))
        return result
