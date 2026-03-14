from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client

from app.api.routes import router
from app.core.config import settings
from app.services.chat_service import ChatService
from app.services.document_processor import DocumentProcessor
from app.services.embeddings import EmbeddingsService
from app.services.storage import StorageService

# --------------------------------------------------------------------------- #
#  Structured logging setup
# --------------------------------------------------------------------------- #

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        logging.getLevelName(settings.log_level.upper())
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


# --------------------------------------------------------------------------- #
#  Lifespan: initialise shared services
# --------------------------------------------------------------------------- #

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create Supabase client and wire up services on startup."""
    logger.info("startup", supabase_url=settings.supabase_url)

    supabase = create_client(settings.supabase_url, settings.supabase_key)

    # Services
    embeddings_service = EmbeddingsService(supabase)
    storage_service = StorageService(supabase)
    chat_service = ChatService(embeddings_service)
    processor = DocumentProcessor()

    # Attach to app.state so route handlers can access them
    app.state.supabase = supabase
    app.state.embeddings = embeddings_service
    app.state.storage = storage_service
    app.state.chat = chat_service
    app.state.processor = processor

    logger.info("services_ready")
    yield
    logger.info("shutdown")


# --------------------------------------------------------------------------- #
#  Application factory
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="DevOps Knowledge Base API",
    description=(
        "RAG-powered chatbot backend for DevOps documentation. "
        "Upload infrastructure docs and ask questions with cited sources."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(router, prefix="/api/v1")
