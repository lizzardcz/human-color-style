from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from apps.api.analysis.pipeline import analyze_portrait
from apps.api.config import get_settings
from apps.api.export import render_url
from apps.api.generation.replicate_client import ImageGenerationClient
from apps.api.schemas import AnalysisResponse, ExportRequest, ExportResponse, GenerateRequest, GenerateResponse, ReportRecord, ReportSaveRequest
from apps.api.storage import create_report, get_report, list_reports
from packages.palette import load_palette

settings = get_settings()
app = FastAPI(title="Human Color Skill API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/seasons")
def seasons() -> dict:
    return load_palette()


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)) -> AnalysisResponse:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Image is empty")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 8MB limit")
    return analyze_portrait(data)


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    client = ImageGenerationClient(settings)
    return await client.generate(request)


@app.post("/api/reports", response_model=ReportRecord)
async def save_report(request: ReportSaveRequest) -> ReportRecord:
    return ReportRecord(**create_report(request.report))


@app.get("/api/reports", response_model=list[ReportRecord])
async def reports(limit: int = 20) -> list[ReportRecord]:
    return [ReportRecord(**record) for record in list_reports(limit)]


@app.get("/api/reports/{report_id}", response_model=ReportRecord)
async def report(report_id: str) -> ReportRecord:
    record = get_report(report_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportRecord(**record)


@app.post("/api/export", response_model=ExportResponse)
async def export_report(request: ExportRequest) -> ExportResponse:
    try:
        payload = await render_url(str(request.url), request.width, request.height, request.output)  # type: ignore[arg-type]
    except RuntimeError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    return ExportResponse(
        mime_type="application/pdf" if request.output == "pdf" else "image/png",
        base64=payload,
    )
