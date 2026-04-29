from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class Axes(BaseModel):
    warmth: float = Field(ge=0, le=1)
    lightness: float = Field(ge=0, le=1)
    chroma: float = Field(ge=0, le=1)
    contrast: float = Field(ge=0, le=1)


class BaseTone(BaseModel):
    key: str
    label: str
    hex: str


class DynamicPalette(BaseModel):
    bestColors: list[str]
    neutrals: list[str]
    accents: list[str]
    avoidColors: list[str]
    nearColors: list[str]


class AnalysisResponse(BaseModel):
    season: str
    confidence: float = Field(ge=0, le=1)
    axes: Axes
    base_palette: list[BaseTone]
    recommended_palette: DynamicPalette
    analysis_method: str = "fallback-relative-boxes"
    warnings: list[str] = []


class GenerateRequest(BaseModel):
    image_url: HttpUrl | None = None
    image_data_url: str | None = None
    prompt: str
    season_id: str = "soft_autumn"
    n: int = Field(default=1, ge=1, le=4)


class GeneratedImage(BaseModel):
    url: str
    provider: str = "replicate"
    prompt: str


class GenerateResponse(BaseModel):
    images: list[GeneratedImage]
    degraded: bool = False
    message: str | None = None


class ReportSaveRequest(BaseModel):
    report: dict[str, Any]


class ReportRecord(BaseModel):
    id: str
    report: dict[str, Any]
    created_at: str
    updated_at: str


class ExportRequest(BaseModel):
    url: HttpUrl
    width: int = Field(default=1080, ge=320, le=4096)
    height: int = Field(default=1350, ge=320, le=4096)
    output: str = Field(default="png", pattern="^(png|pdf)$")


class ExportResponse(BaseModel):
    mime_type: str
    base64: str
