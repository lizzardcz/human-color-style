from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"
API_ENV = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    image_provider: str = "autocode"
    autocode_api_key: str = ""
    autocode_base_url: str = "https://api.autocode.space"
    autocode_image_model: str = "gpt-image-2"
    autocode_image_size: str = "1728x2304"
    replicate_fallback_enabled: bool = False
    replicate_api_token: str = ""
    replicate_image_model: str = ""
    replicate_image_width: int = 1728
    replicate_image_height: int = 2304
    replicate_supports_image_input: bool = True

    model_config = SettingsConfigDict(
        env_file=(ROOT_ENV, API_ENV),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
