"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings loaded from .env file or environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Discourse
    discourse_base_url: str = Field(..., description="Discourse instance base URL")
    discourse_api_key: str = Field(..., description="Discourse API key")
    discourse_api_username: str = Field(..., description="Discourse bot account username")

    # NVIDIA NIM
    nvidia_api_key: str = Field(..., description="NVIDIA NIM API key")
    nvidia_base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        description="NVIDIA NIM base URL",
    )
    nvidia_embed_model: str = Field(default="nvidia/nv-embed-v1")
    nvidia_gen_model: str = Field(default="nvidia/llama-3.1-70b-instruct")

    # Rate limiting
    rate_limit_rpm: int = Field(default=30)

    # SLA
    sla_window_minutes: int = Field(default=5)
    sla_grace_minutes: int = Field(default=10)

    # Confidence
    confidence_threshold: float = Field(default=0.35)

    # State
    state_db_path: str = Field(default="state.db")

    # Chroma
    chroma_persist_dir: str = Field(default="chroma")


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
