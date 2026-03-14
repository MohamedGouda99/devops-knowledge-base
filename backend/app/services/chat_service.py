from __future__ import annotations

import uuid
from typing import Any

import structlog
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.core.config import settings
from app.models.schemas import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    SourceReference,
)
from app.services.embeddings import EmbeddingsService

logger = structlog.get_logger(__name__)

SYSTEM_PROMPT = """\
You are a senior DevOps / SRE expert assistant. Your knowledge covers Kubernetes, \
Terraform, AWS, GCP, Azure, CI/CD pipelines, Docker, monitoring, security, and \
infrastructure-as-code best practices.

When answering:
1. Use the CONTEXT DOCUMENTS provided below to ground your answer.
2. Cite specific documents by title when referencing information (e.g., "[Source: <title>]").
3. If the context does not contain enough information, say so clearly and provide \
   your best general guidance while noting it is not from the provided documents.
4. Provide practical, production-ready advice with code examples when appropriate.
5. Keep answers well-structured using bullet points or numbered steps for clarity.

CONTEXT DOCUMENTS:
{context}
"""


class ChatService:
    """RAG-powered chat that retrieves context from the vector store."""

    def __init__(self, embeddings_service: EmbeddingsService) -> None:
        self._embeddings = embeddings_service
        self._llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.1,
            streaming=False,
        )

    async def ask(self, request: ChatRequest) -> ChatResponse:
        """Perform retrieval-augmented generation for *request.question*."""
        conversation_id = str(uuid.uuid4())

        # 1. Retrieve relevant chunks ----------------------------------------
        similar = await self._embeddings.search_similar(
            query=request.question,
            k=request.k,
        )

        # 2. Build context string + source references ------------------------
        context_parts: list[str] = []
        sources: list[SourceReference] = []
        seen_chunk_ids: set[str] = set()

        for doc in similar:
            chunk_id = doc.get("id", "")
            if chunk_id in seen_chunk_ids:
                continue
            seen_chunk_ids.add(chunk_id)

            title = doc.get("document_title", "Unknown")
            content = doc.get("content", "")
            score = float(doc.get("similarity", 0.0))

            context_parts.append(
                f"--- Document: {title} (chunk {doc.get('chunk_index', '?')}) ---\n"
                f"{content}\n"
            )
            sources.append(
                SourceReference(
                    document_title=title,
                    content_preview=content[:300],
                    relevance_score=round(score, 4),
                    chunk_id=chunk_id,
                )
            )

        context_text = "\n".join(context_parts) if context_parts else "(No relevant documents found.)"

        # 3. Assemble message list -------------------------------------------
        messages: list[SystemMessage | HumanMessage | AIMessage] = [
            SystemMessage(content=SYSTEM_PROMPT.format(context=context_text)),
        ]

        for msg in request.conversation_history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))

        messages.append(HumanMessage(content=request.question))

        # 4. Call LLM --------------------------------------------------------
        logger.info(
            "llm_call",
            question_length=len(request.question),
            context_chunks=len(sources),
            history_length=len(request.conversation_history),
        )

        ai_response = await self._llm.ainvoke(messages)
        answer = ai_response.content if isinstance(ai_response.content, str) else str(ai_response.content)

        logger.info(
            "llm_response",
            answer_length=len(answer),
            conversation_id=conversation_id,
        )

        return ChatResponse(
            answer=answer,
            sources=sources,
            conversation_id=conversation_id,
        )
