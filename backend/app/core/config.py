from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- Supabase ---------------------------------------------------------
    supabase_url: str
    supabase_key: str
    supabase_db_connection_string: str = ""

    # --- OpenAI -----------------------------------------------------------
    openai_api_key: str
    openai_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # --- RAG tuning -------------------------------------------------------
    chunk_size: int = 1000
    chunk_overlap: int = 200
    similarity_top_k: int = 5

    # --- CORS / server ----------------------------------------------------
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    log_level: str = "info"

    # --- Storage ----------------------------------------------------------
    upload_bucket: str = "documents"
    max_upload_mb: int = 50


settings = Settings()  # type: ignore[call-arg]
