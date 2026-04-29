"use client";

import { Download, FileImage, FileText, ImagePlus, Link2, Loader2, Share2, Sparkles, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ReportCardA } from "./ReportCardA";
import { ReportCardB } from "./ReportCardB";
import { createDemoReport } from "@/lib/report";
import { downloadNodeAsPdf, downloadNodeAsPng } from "@/lib/export";
import { analyzePortrait, generateLookImage, saveReport, type ApiAnalysisResponse } from "@/lib/api";

type ActiveReport = "color" | "image";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReportStudio() {
  const [portrait, setPortrait] = useState<string>();
  const [analysis, setAnalysis] = useState<ApiAnalysisResponse>();
  const [generatedLooks, setGeneratedLooks] = useState<Record<string, string>>({});
  const [activeReport, setActiveReport] = useState<ActiveReport>("color");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("等待上传自然光正脸照");
  const [shareUrl, setShareUrl] = useState<string>();
  const colorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => {
    const baseReport = createDemoReport(portrait, "zh-CN", analysis);
    return {
      ...baseReport,
      looks: baseReport.looks.map((look) => ({
        ...look,
        imageUrl: generatedLooks[look.id] ?? look.imageUrl,
      })),
    };
  }, [portrait, analysis, generatedLooks]);
  const activeRef = activeReport === "color" ? colorRef : imageRef;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("请上传 JPG 或 PNG 图片");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatus("图片超过 8MB，请压缩后再试");
      return;
    }

    setIsAnalyzing(true);
    setGeneratedLooks({});
    setShareUrl(undefined);
    setStatus("正在读取照片并生成预览...");
    const dataUrl = await readFileAsDataUrl(file);
    setPortrait(dataUrl);
    setStatus("正在调用本地 FastAPI 色彩分析...");

    try {
      const liveAnalysis = await analyzePortrait(file);
      setAnalysis(liveAnalysis);
      setStatus(`已完成自动分析：${liveAnalysis.season}，置信度 ${Math.round(liveAnalysis.confidence * 100)}%`);
    } catch {
      setAnalysis(undefined);
      setStatus("后端暂未启动或分析失败，已使用 Soft Autumn 柔秋演示报告继续预览");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function exportPng(size: "feed" | "story") {
    if (!activeRef.current) return;
    const suffix = activeReport === "color" ? "color-card" : "image-report";
    await downloadNodeAsPng(activeRef.current, `personal-${suffix}-${size}.png`, size === "story" ? 2.4 : 2);
  }

  async function exportPdf() {
    if (!activeRef.current) return;
    const suffix = activeReport === "color" ? "color-card" : "image-report";
    await downloadNodeAsPdf(activeRef.current, `personal-${suffix}.pdf`);
  }

  async function generateLooks() {
    setIsGenerating(true);
    setActiveReport("image");
    setStatus("正在调用 Autocode GPT-image-2 生成核心形象图...");
    const baseLooks = report.looks.slice(0, 6);
    const nextLooks: Record<string, string> = { ...generatedLooks };

    try {
      for (const [index, look] of baseLooks.entries()) {
        setStatus(`正在生成 ${index + 1}/${baseLooks.length}：${look.title}`);
        const response = await generateLookImage({
          prompt: look.prompt,
          seasonId: report.season.id,
          imageDataUrl: portrait,
        });
        const imageUrl = response.images[0]?.url;
        if (imageUrl) {
          nextLooks[look.id] = imageUrl;
          setGeneratedLooks({ ...nextLooks });
        }
        if (response.degraded && response.message) {
          setStatus(response.message);
        }
      }
      setStatus("AI 形象图生成完成，可导出或分享报告。");
    } catch {
      setStatus("AI 形象图生成失败：请检查 AUTOCODE_API_KEY、模型名或网络；报告仍可使用占位图导出。");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveAndShare() {
    setIsSaving(true);
    setStatus("正在保存报告并生成分享链接...");
    try {
      const saved = await saveReport(report);
      const url = `${window.location.origin}/share/${saved.id}`;
      setShareUrl(url);
      localStorage.setItem(`human-color-report:${saved.id}`, JSON.stringify(saved));
      await navigator.clipboard?.writeText(url);
      setStatus("报告已保存，分享链接已复制到剪贴板。");
    } catch {
      const localId = `local-${Date.now().toString(36)}`;
      const localReport = { id: localId, report: { ...report, id: localId }, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      localStorage.setItem(`human-color-report:${localId}`, JSON.stringify(localReport));
      const url = `${window.location.origin}/share/${localId}`;
      setShareUrl(url);
      await navigator.clipboard?.writeText(url);
      setStatus("后端暂未启动，已保存到本机浏览器并复制本地分享链接。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-[#eadbc8] bg-white/80 p-6 shadow-xl shadow-[#a67c52]/10 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3d2016] text-white">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#a67c52]">AI Personal Color</p>
              <h2 className="text-xl font-bold text-[#3d2016]">生成诊断报告</h2>
            </div>
          </div>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#d8b896] bg-[#fff8ef] px-6 py-10 text-center transition hover:border-[#a67c52] hover:bg-[#fff4e4]">
            <UploadCloud className="mb-4 text-[#a67c52]" size={36} />
            <span className="text-base font-bold text-[#3d2016]">上传正脸照</span>
            <span className="mt-2 text-sm leading-relaxed text-[#7b6152]">JPG/PNG，建议自然光、无遮挡、无浓妆。第一版本地预览，后端会接入真实分析。</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          <div className="mt-5 rounded-2xl bg-[#f4e6d6] p-4 text-sm text-[#5a3b2c]">
            <div className="mb-2 flex items-center gap-2 font-bold">
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <FileImage size={16} />}
              状态
            </div>
            <p>{status}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#fbf6ed] p-2">
            <button
              className={`rounded-xl px-3 py-3 text-sm font-bold transition ${activeReport === "color" ? "bg-[#3d2016] text-white" : "text-[#7b6152] hover:bg-white"}`}
              onClick={() => setActiveReport("color")}
            >
              色彩卡
            </button>
            <button
              className={`rounded-xl px-3 py-3 text-sm font-bold transition ${activeReport === "image" ? "bg-[#3d2016] text-white" : "text-[#7b6152] hover:bg-white"}`}
              onClick={() => setActiveReport("image")}
            >
              形象报告
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3d2016] px-4 py-3 font-bold text-white shadow-lg shadow-[#3d2016]/20 transition hover:bg-[#2b170f] disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void generateLooks()} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />} 生成 AI 形象图
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a67c52] px-4 py-3 font-bold text-white shadow-lg shadow-[#a67c52]/25 transition hover:bg-[#8b6849]" onClick={() => void exportPng("feed")}>
              <Download size={18} /> 下载 IG Feed PNG
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8b896] bg-white px-4 py-3 font-bold text-[#3d2016] transition hover:bg-[#fff8ef]" onClick={() => void exportPng("story")}>
              <Share2 size={18} /> 下载 Story PNG
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8b896] bg-white px-4 py-3 font-bold text-[#3d2016] transition hover:bg-[#fff8ef]" onClick={() => void exportPdf()}>
              <FileText size={18} /> 下载 PDF
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8b896] bg-white px-4 py-3 font-bold text-[#3d2016] transition hover:bg-[#fff8ef] disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void saveAndShare()} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Link2 size={18} />} 保存并复制分享链接
            </button>
          </div>

          {shareUrl ? (
            <a href={shareUrl} className="mt-4 block break-all rounded-2xl border border-[#d8b896] bg-[#fff8ef] p-3 text-xs font-semibold text-[#5a3b2c] hover:bg-white">
              {shareUrl}
            </a>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[#eadbc8] bg-white p-4 text-xs leading-relaxed text-[#7b6152]">
            <p className="font-bold text-[#3d2016]">当前链路</p>
            <p>肤色分析在本地 FastAPI 完成，AI 形象图默认调用 Autocode GPT-image-2；Replicate 代码仅作为可选备用，默认关闭。</p>
          </div>
        </aside>

        <div className="overflow-x-auto rounded-[2rem] border border-[#eadbc8] bg-[#efe2d2] p-6 shadow-inner">
          <div ref={colorRef} className={activeReport === "color" ? "block" : "hidden"}>
            <ReportCardA report={report} />
          </div>
          <div ref={imageRef} className={activeReport === "image" ? "block" : "hidden"}>
            <ReportCardB report={report} />
          </div>
        </div>
      </div>
    </section>
  );
}
