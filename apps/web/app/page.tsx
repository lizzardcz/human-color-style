import Link from "next/link";
import { ArrowRight, Camera, Download, Globe2, Palette, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const demoFeatures: Array<[LucideIcon, string]> = [
  [Camera, "Face color extraction"],
  [Palette, "12-season matching"],
  [Sparkles, "Replicate image prompts"],
  [Download, "PNG / PDF export"],
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fbf6ed] text-[#3d2016]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3d2016] text-white shadow-lg shadow-[#3d2016]/20">
            <Palette size={22} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#a67c52]">Human Color</p>
            <p className="font-serif text-xl font-bold">Personal Image AI</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[#eadbc8] bg-white/70 px-4 py-2 text-sm font-semibold text-[#7b6152] sm:flex">
          <Globe2 size={16} /> EN / 中文 / ES / JP / KR
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8 lg:pb-24 lg:pt-14">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadbc8] bg-white/70 px-4 py-2 text-sm font-bold text-[#7b6152] shadow-sm">
              <Sparkles size={16} className="text-[#a67c52]" /> Instagram-ready PNG reports
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-black leading-[1.04] tracking-tight sm:text-7xl">
              Upload a portrait, generate a premium personal color report.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6b4a39]">
              自动分析肤色、发色、瞳色和唇色，生成四季色彩诊断卡、个人形象报告、推荐色板和适合 Instagram 发布的高清 PNG。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/analyze" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3d2016] px-7 py-4 text-base font-bold text-white shadow-xl shadow-[#3d2016]/20 transition hover:-translate-y-0.5 hover:bg-[#2b170f]">
                Start analysis <ArrowRight size={18} />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8b896] bg-white/70 px-7 py-4 text-base font-bold text-[#3d2016] transition hover:-translate-y-0.5 hover:bg-white">
                See workflow
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[#d4915a]/30 blur-3xl" />
            <div className="absolute -bottom-10 -right-8 h-48 w-48 rounded-full bg-[#8b7355]/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-[#eadbc8] bg-white/80 p-5 shadow-2xl shadow-[#a67c52]/20 backdrop-blur">
              <div className="rounded-[1.4rem] bg-[#fbf6ed] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a67c52]">Demo Result</p>
                    <h2 className="font-serif text-3xl font-bold">Soft Autumn</h2>
                  </div>
                  <span className="rounded-full bg-[#3d2016] px-3 py-1 text-xs font-bold text-white">82% match</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {["#F3E5D0", "#A67C52", "#8B7355", "#D4915A", "#5C5340"].map((color) => (
                    <div key={color} className="h-20 rounded-xl shadow-inner" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {demoFeatures.map(([Icon, label]) => (
                    <div key={String(label)} className="rounded-2xl border border-[#eadbc8] bg-white p-4">
                      <Icon className="mb-3 text-[#a67c52]" size={20} />
                      <p className="text-sm font-bold">{String(label)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-[#eadbc8] bg-white/50 py-12">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              ["01", "Upload", "上传自然光正脸照，前端即时预览。"],
              ["02", "Analyze", "FastAPI 提取肤/发/唇/瞳色并匹配季型。"],
              ["03", "Generate", "Replicate 生成穿搭、发型、眼镜、妆容预览。"],
              ["04", "Export", "导出 IG Feed / Story PNG 与 PDF。"],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-3xl border border-[#eadbc8] bg-[#fbf6ed] p-6">
                <p className="text-sm font-black text-[#a67c52]">{step}</p>
                <h3 className="mt-3 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6b4a39]">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
