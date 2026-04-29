import { AxisSlider } from "./AxisSlider";
import { LookCard } from "./LookCard";
import { PaletteGrid } from "./PaletteGrid";
import { PortraitFrame } from "./PortraitFrame";
import { ReportHeader } from "./ReportHeader";
import type { ReportData } from "@/lib/report";

interface ReportCardBProps {
  report: ReportData;
}

export function ReportCardB({ report }: ReportCardBProps) {
  const { season } = report;
  const palette = report.palette;

  return (
    <article className="mx-auto w-[1080px] bg-[#fbf6ed] p-7 text-[#3d2016] shadow-2xl">
      <ReportHeader title="PERSONAL IMAGE REPORT" subtitle="个人形象诊断总报告" />

      <div className="mt-5 grid grid-cols-[390px_1fr] gap-5">
        <section className="overflow-hidden rounded-md border border-[#e4cfb9] bg-white/50">
          <PortraitFrame src={report.uploadedImage} className="h-[285px] border-0" />
          <div className="bg-[#ead8c2] px-5 py-5 text-center">
            <h2 className="font-serif text-4xl font-bold">{season.names.en}</h2>
            <p className="text-2xl font-bold">{season.names["zh-CN"]}</p>
            <p className="mt-2 text-base text-[#6b4a39]">{season.description["zh-CN"]}</p>
          </div>
        </section>

        <section className="rounded-md border border-[#e4cfb9] bg-white/50 p-5">
          <h2 className="mb-3 text-2xl font-bold">色彩坐标</h2>
          <div className="space-y-4">
            <AxisSlider label="底调" left="暖" right="冷" value={1 - report.axes.warmth} gradient="linear-gradient(90deg,#b8693f,#f2d5ba,#90a9d7)" />
            <AxisSlider label="明度" left="浅" right="深" value={1 - report.axes.lightness} gradient="linear-gradient(90deg,#f7efe5,#b69b84,#241c18)" />
            <AxisSlider label="彩度" left="鲜亮" right="柔和" value={1 - report.axes.chroma} gradient="linear-gradient(90deg,#e84d3d,#e3a7a0,#d9d1c2)" />
            <AxisSlider label="对比" left="低" right="高" value={report.axes.contrast} gradient="linear-gradient(90deg,#efe5d8,#9a8f84,#1f1a17)" />
          </div>

          <h2 className="mb-3 mt-6 text-2xl font-bold">风格关键词</h2>
          <div className="flex flex-wrap gap-2">
            {season.keywords.slice(0, 6).map((keyword) => (
              <span key={keyword} className="rounded-full bg-[#ead8c2] px-5 py-2 text-sm font-bold text-[#5a3b2c]">{keyword}</span>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-2xl font-bold">推荐色</h2>
          <PaletteGrid colors={palette.bestColors.slice(0, 10)} columns={5} compact />
        </section>
      </div>

      <section className="mt-5 rounded-md border border-[#e4cfb9] bg-white/45 p-4">
        <h2 className="mb-3 text-2xl font-bold">穿搭风格</h2>
        <div className="grid grid-cols-6 gap-3">
          {report.looks.map((look, index) => (
            <LookCard key={look.id} look={look} index={index} />
          ))}
        </div>
      </section>

      <div className="mt-5 grid grid-cols-[1.2fr_1fr] gap-5">
        <section className="rounded-md border border-[#e4cfb9] bg-white/45 p-4">
          <h2 className="mb-3 text-2xl font-bold">妆容指南（男性版）</h2>
          <div className="grid grid-cols-5 gap-3">
            {[
              ["眉型", season.makeup?.brow ?? "#4A3428", "深棕"],
              ["唇色", season.makeup?.lip ?? "#D4A08A", "暖砂粉"],
              ["镜框", season.accessoryColors?.[0] ?? "#8B6F47", "玳瑁棕"],
              ["眼金属", season.makeup?.shadow ?? "#C19A6B", "暖金属"],
              ["深眼线", season.makeup?.deepShadow ?? "#5C5340", "深橄榄"],
            ].map(([title, color, label]) => (
              <div key={title} className="rounded border border-[#eadbc8] bg-[#fffaf4] p-2 text-center">
                <div className="mx-auto mb-2 h-20 w-full rounded" style={{ backgroundColor: color }} />
                <p className="text-xs font-bold">{title}</p>
                <p className="text-[10px] text-[#7b6152]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#e4cfb9] bg-white/45 p-4">
          <h2 className="mb-3 text-2xl font-bold">发型</h2>
          <div className="grid grid-cols-4 gap-3">
            {["商务侧分", "自然短发", "纹理蓬发", "清爽后梳"].map((title, index) => (
              <div key={title} className="rounded border border-[#eadbc8] bg-[#fffaf4] p-2 text-center">
                <div className="relative mx-auto mb-2 h-24 w-20 overflow-hidden rounded-t-full bg-[#f0c9ad]">
                  <span
                    className="absolute left-0 top-0 h-10 w-full rounded-b-[70%]"
                    style={{ backgroundColor: season.hairColors?.[index] ?? "#2B2520" }}
                  />
                </div>
                <p className="text-xs font-bold">{title}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <section className="rounded-md border border-[#e4cfb9] bg-white/45 p-4">
          <h2 className="mb-3 text-2xl font-bold">发色</h2>
          <PaletteGrid colors={season.hairColors ?? palette.neutrals.slice(-4)} columns={4} compact />
        </section>
        <section className="rounded-md border border-[#e4cfb9] bg-white/45 p-4">
          <h2 className="mb-3 text-2xl font-bold">饰品 · 眼镜</h2>
          <PaletteGrid colors={season.accessoryColors ?? season.accents.slice(0, 3)} columns={3} compact />
        </section>
        <section className="rounded-md border border-[#e4cfb9] bg-white/45 p-4">
          <h2 className="mb-3 text-2xl font-bold">避雷清单</h2>
          <PaletteGrid colors={palette.avoidColors.slice(0, 6)} columns={6} compact />
        </section>
      </div>

      <section className="mt-5 rounded-md border border-[#e4cfb9] bg-white/45 p-4">
        <h2 className="mb-2 text-2xl font-bold">关键推荐</h2>
        <div className="grid grid-cols-3 gap-4 text-sm leading-relaxed text-[#5a3b2c]">
          <p>选择暖调、低饱和、中低对比的柔和色彩，打造松弛高级感。</p>
          <p>核心单品建议：驼色西装、橄榄针织、暖灰 Polo、咖啡色牛仔裤。</p>
          <p>避免正红、宝蓝、荧光粉、纯黑纯白和冰蓝灰，以免显得突兀。</p>
        </div>
      </section>
    </article>
  );
}
