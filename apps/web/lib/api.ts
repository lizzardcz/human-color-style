import type { AnalysisAxes, BaseTone, ReportPalette } from "./report";
import type { ReportData } from "./report";

export interface ApiAnalysisResponse {
  season: string;
  confidence: number;
  axes: AnalysisAxes;
  base_palette: BaseTone[];
  recommended_palette: ReportPalette;
  warnings: string[];
}

export interface ApiGeneratedImage {
  url: string;
  provider: string;
  prompt: string;
}

export interface ApiGenerateResponse {
  images: ApiGeneratedImage[];
  degraded: boolean;
  message?: string;
}

export interface StoredReportResponse {
  id: string;
  report: ReportData;
  created_at: string;
  updated_at: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000");

export async function analyzePortrait(file: File): Promise<ApiAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed with ${response.status}`);
  }

  return response.json() as Promise<ApiAnalysisResponse>;
}

export async function generateLookImage(options: {
  prompt: string;
  seasonId: string;
  imageDataUrl?: string;
}): Promise<ApiGenerateResponse> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: options.prompt,
      season_id: options.seasonId,
      image_data_url: options.imageDataUrl,
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Generation failed with ${response.status}`);
  }

  return response.json() as Promise<ApiGenerateResponse>;
}

export async function saveReport(report: ReportData): Promise<StoredReportResponse> {
  const response = await fetch(`${API_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report }),
  });

  if (!response.ok) {
    throw new Error(`Save report failed with ${response.status}`);
  }

  return response.json() as Promise<StoredReportResponse>;
}

export async function getReport(id: string): Promise<StoredReportResponse> {
  const response = await fetch(`${API_URL}/api/reports/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Get report failed with ${response.status}`);
  }

  return response.json() as Promise<StoredReportResponse>;
}
