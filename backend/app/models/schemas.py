from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
#  Documents
# --------------------------------------------------------------------------- #

class DocumentBase(BaseModel):
    title: str
    category: str = "general"
    tags: list[str] = Field(default_factory=list)


class DocumentUpload(DocumentBase):
    """Metadata sent alongside a file upload."""
    pass


class Document(DocumentBase):
    """Full document record returned from the database."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    chunk_count: int = 0
    file_size: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentListResponse(BaseModel):
    documents: list[Document]
    total: int


# --------------------------------------------------------------------------- #
#  Chat / RAG
# --------------------------------------------------------------------------- #

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class SourceReference(BaseModel):
    document_title: str
    content_preview: str
    relevance_score: float
    chunk_id: str


class ChatRequest(BaseModel):
    question: str
    conversation_history: list[ChatMessage] = Field(default_factory=list)
    k: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
    conversation_id: str


# --------------------------------------------------------------------------- #
#  Search
# --------------------------------------------------------------------------- #

class SemanticSearchRequest(BaseModel):
    query: str
    k: int = 5
    category: Optional[str] = None


class SemanticSearchResponse(BaseModel):
    results: list[SourceReference]


# --------------------------------------------------------------------------- #
#  Health
# --------------------------------------------------------------------------- #

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
