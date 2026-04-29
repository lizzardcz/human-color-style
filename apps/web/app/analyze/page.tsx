import { ReportStudio } from "@/components/report/ReportStudio";

export default function AnalyzePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f0d0b0_0,transparent_34%),#fbf6ed]">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#a67c52]">Studio</p>
        <h1 className="mt-3 font-serif text-4xl font-black text-[#3d2016] sm:text-6xl">Personal color report builder</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#6b4a39]">
          当前 MVP 先完成上传、报告布局、色卡渲染与 PNG/PDF 导出。接入 FastAPI 与 Replicate Token 后，会替换为真实自动分析和 AI 形象图。
        </p>
      </div>
      <ReportStudio />
    </main>
  );
}
