from __future__ import annotations

import io
import tempfile
from pathlib import Path
from typing import Any

import docx2txt
import structlog
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Supported MIME / extension mapping
_EXTRACTORS: dict[str, str] = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".md": "markdown",
    ".txt": "text",
    ".yaml": "text",
    ".yml": "text",
    ".json": "text",
    ".tf": "text",
    ".hcl": "text",
    ".sh": "text",
    ".py": "text",
    ".js": "text",
    ".ts": "text",
}


class DocumentProcessor:
    """Extracts text from files and splits into LangChain-style chunks."""

    def __init__(self) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #

    async def process(
        self,
        file_bytes: bytes,
        filename: str,
        document_id: str,
        category: str = "general",
        tags: list[str] | None = None,
    ) -> tuple[list[str], list[dict[str, Any]]]:
        """Return ``(chunks, metadatas)`` ready for embedding.

        Raises ``ValueError`` for unsupported file types.
        """
        ext = Path(filename).suffix.lower()
        if ext not in _EXTRACTORS:
            raise ValueError(
                f"Unsupported file type '{ext}'. "
                f"Supported: {', '.join(sorted(_EXTRACTORS))}"
            )

        extractor = _EXTRACTORS[ext]
        logger.info("processing_file", filename=filename, extractor=extractor)

        raw_text = self._extract_text(file_bytes, extractor)
        if not raw_text.strip():
            raise ValueError(f"No text could be extracted from '{filename}'.")

        chunks = self._splitter.split_text(raw_text)

        metadatas: list[dict[str, Any]] = [
            {
                "document_id": document_id,
                "filename": filename,
                "category": category,
                "tags": tags or [],
                "chunk_index": idx,
                "total_chunks": len(chunks),
            }
            for idx in range(len(chunks))
        ]

        logger.info(
            "file_processed",
            filename=filename,
            total_chars=len(raw_text),
            num_chunks=len(chunks),
        )
        return chunks, metadatas

    # ------------------------------------------------------------------ #
    #  Text extraction
    # ------------------------------------------------------------------ #

    def _extract_text(self, data: bytes, extractor: str) -> str:
        if extractor == "pdf":
            return self._extract_pdf(data)
        if extractor == "docx":
            return self._extract_docx(data)
        # markdown / plain text
        return data.decode("utf-8", errors="replace")

    @staticmethod
    def _extract_pdf(data: bytes) -> str:
        reader = PdfReader(io.BytesIO(data))
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)

    @staticmethod
    def _extract_docx(data: bytes) -> str:
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(data)
            tmp.flush()
            text: str = docx2txt.process(tmp.name)
        return text
