"use client";

import Link from "next/link";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReportCardA } from "./ReportCardA";
import { ReportCardB } from "./ReportCardB";
import { getReport, type StoredReportResponse } from "@/lib/api";
import { downloadNodeAsPdf, downloadNodeAsPng } from "@/lib/export";
import { createDemoReport, type ReportData } from "@/lib/report";

interface ReportViewerClientProps {
  id: string;
  mode: "result" | "share";
}

export function ReportViewerClient({ id, mode }: ReportViewerClientProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [status, setStatus] = useState("正在加载报告...");
  const colorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const record = await getReport(id);
        if (!cancelled) {
          setReport(record.report);
          setStatus("已从后端加载报告。");
        }
        return;
      } catch {
        // Continue to browser fallback.
      }

      try {
        const raw = localStorage.getItem(`human-color-report:${id}`);
        if (raw) {
          const record = JSON.parse(raw) as StoredReportResponse;
          if (!cancelled) {
            setReport(record.report);
            setStatus("已从本机浏览器加载报告。");
          }
          return;
        }
      } catch {
        // Continue to demo fallback.
      }

      if (!cancelled) {
        setReport(createDemoReport());
        setStatus("未找到报告，显示演示报告。请确认后端已启动或分享链接有效。")
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function exportCurrent(kind: "color" | "image", type: "png" | "pdf") {
    const node = kind === "color" ? colorRef.current : imageRef.current;
    if (!node) return;
    if (type === "png") {
      await downloadNodeAsPng(node, `human-color-${kind}-${id}.png`, 2);
    } else {
      await downloadNodeAsPdf(node, `human-color-${kind}-${id}.pdf`);
    }
  }

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf6ed] text-[#3d2016]">
        <div className="flex items-center gap-3 rounded-3xl border border-[#eadbc8] bg-white px-6 py-4 shadow-sm">
          <Loader2 className="animate-spin" />
          {status}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#efe2d2] px-4 py-8">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 rounded-3xl border border-[#eadbc8] bg-white/85 px-6 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#a67c52]">{mode === "share" ? "Shared report" : "Result"} {id}</p>
          <h1 className="font-serif text-3xl font-bold text-[#3d2016]">{report.season.names.en} / {report.season.names["zh-CN"]}</h1>
          <p className="mt-1 text-sm text-[#7b6152]">{status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-full border border-[#d8b896] bg-white px-4 py-2 text-sm font-bold text-[#3d2016]" onClick={() => void exportCurrent("color", "png")}>
            <Download size={16} /> 色彩卡 PNG
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#d8b896] bg-white px-4 py-2 text-sm font-bold text-[#3d2016]" onClick={() => void exportCurrent("image", "png")}>
            <Download size={16} /> 形象报告 PNG
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#d8b896] bg-white px-4 py-2 text-sm font-bold text-[#3d2016]" onClick={() => void exportCurrent("image", "pdf")}>
            <FileText size={16} /> PDF
          </button>
          <Link href="/analyze" className="rounded-full bg-[#3d2016] px-4 py-2 text-sm font-bold text-white">
            Create my report
          </Link>
        </div>
      </div>
      <div className="space-y-10 overflow-x-auto">
        <div ref={colorRef}>
          <ReportCardA report={report} />
        </div>
        <div ref={imageRef}>
          <ReportCardB report={report} />
        </div>
      </div>
    </main>
  );
}
