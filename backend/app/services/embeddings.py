from __future__ import annotations

import uuid
from typing import Any

import structlog
from langchain_openai import OpenAIEmbeddings
from supabase import Client as SupabaseClient

from app.core.config import settings

logger = structlog.get_logger(__name__)


class EmbeddingsService:
    """Handles vector embedding operations against Supabase pgvector."""

    def __init__(self, supabase: SupabaseClient) -> None:
        self._supabase = supabase
        self._embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key,
            dimensions=settings.embedding_dimensions,
        )

    # ------------------------------------------------------------------ #
    #  Store
    # ------------------------------------------------------------------ #

    async def store_document_chunks(
        self,
        document_id: str,
        document_title: str,
        chunks: list[str],
        metadatas: list[dict[str, Any]],
    ) -> int:
        """Embed *chunks* and upsert them into the ``document_chunks`` table.

        Returns the number of chunks stored.
        """
        logger.info(
            "embedding_chunks",
            document_id=document_id,
            num_chunks=len(chunks),
        )

        vectors = await self._embeddings.aembed_documents(chunks)

        rows: list[dict[str, Any]] = []
        for idx, (chunk, vector, meta) in enumerate(
            zip(chunks, vectors, metadatas, strict=True)
        ):
            rows.append(
                {
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "document_title": document_title,
                    "content": chunk,
                    "embedding": vector,
                    "metadata": {**meta, "chunk_index": idx},
                    "chunk_index": idx,
                }
            )

        self._supabase.table("document_chunks").insert(rows).execute()

        logger.info(
            "chunks_stored",
            document_id=document_id,
            stored=len(rows),
        )
        return len(rows)

    # ------------------------------------------------------------------ #
    #  Search
    # ------------------------------------------------------------------ #

    async def search_similar(
        self,
        query: str,
        k: int = 5,
        category: str | None = None,
    ) -> list[dict[str, Any]]:
        """Return the *k* most similar chunks for *query*.

        Uses the Supabase RPC ``match_documents`` which wraps a pgvector
        cosine-similarity query.
        """
        query_vector = await self._embeddings.aembed_query(query)

        params: dict[str, Any] = {
            "query_embedding": query_vector,
            "match_count": k,
        }
        if category:
            params["filter_category"] = category

        rpc_name = "match_documents_by_category" if category else "match_documents"
        response = self._supabase.rpc(rpc_name, params).execute()

        results: list[dict[str, Any]] = response.data or []

        logger.info(
            "similarity_search",
            query_length=len(query),
            results=len(results),
        )
        return results

    # ------------------------------------------------------------------ #
    #  Delete
    # ------------------------------------------------------------------ #

    async def delete_document_chunks(self, document_id: str) -> int:
        """Remove all chunks belonging to *document_id*. Returns count deleted."""
        response = (
            self._supabase.table("document_chunks")
            .delete()
            .eq("document_id", document_id)
            .execute()
        )
        count = len(response.data) if response.data else 0
        logger.info(
            "chunks_deleted",
            document_id=document_id,
            deleted=count,
        )
        return count
