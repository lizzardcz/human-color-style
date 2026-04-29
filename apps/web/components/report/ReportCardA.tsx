import { PaletteGrid } from "./PaletteGrid";
import { PortraitFrame } from "./PortraitFrame";
import { ReportHeader } from "./ReportHeader";
import type { ReportData } from "@/lib/report";

interface ReportCardAProps {
  report: ReportData;
}

const neutralLabels = ["燕麦米白", "暖灰", "驼色", "深棕", "咖啡棕", "炭灰棕"];
const avoidLabels = ["正红", "宝蓝", "荧光粉", "纯白", "纯黑", "冰蓝"];
const nearLabels = ["冷粉", "灰蓝", "冷紫", "银灰", "冷绿", "浅灰"];

export function ReportCardA({ report }: ReportCardAProps) {
  const { season } = report;
  const palette = report.palette;
  const seasonZh = season.names["zh-CN"];

  return (
    <article className="mx-auto w-[1080px] bg-[#fbf6ed] p-8 text-[#3d2016] shadow-2xl">
      <ReportHeader title="PERSONAL COLOR ANALYSIS" subtitle="四季色彩诊断卡" />

      <div className="mt-6 grid grid-cols-[330px_1fr] gap-7">
        <section className="space-y-4">
          <PortraitFrame src={report.uploadedImage} className="h-[410px]" />

          <div className="divide-y divide-[#e4cfb9] rounded-sm border border-[#e4cfb9] bg-white/45 text-sm">
            {[
              ["季型", `${season.names.en} ${seasonZh}`],
              ["亚型", seasonZh],
              ["底调", "暖中性"],
              ["彩度", "柔和"],
              ["对比度", "中低"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_1fr]">
                <span className="border-r border-[#e4cfb9] px-4 py-2 font-semibold">{label}：</span>
                <span className="px-4 py-2 text-center font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-sm border border-[#e4cfb9] bg-white/45 p-4 text-center">
            <h2 className="mb-4 text-xl font-bold tracking-[0.2em]">本人基色</h2>
            <div className="grid grid-cols-3 gap-4">
              {report.baseTones.map((tone) => (
                <div key={tone.key} className="flex flex-col items-center gap-2">
                  <span className="h-16 w-16 rounded-full border border-[#dfc3a6]" style={{ backgroundColor: tone.hex }} />
                  <div className="text-xs leading-tight">
                    <p className="font-semibold">{tone.label}</p>
                    <p>{tone.hex.toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-[#e4cfb9] bg-white/45 p-4 text-center">
            <h2 className="mb-4 text-xl font-bold tracking-[0.2em]">风格关键词</h2>
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
              {season.keywords.slice(0, 4).map((keyword) => (
                <span key={keyword} className="rounded bg-[#f3e5d0] px-2 py-2">{keyword}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="mb-3 border-b border-[#d8c1a8] pb-1 text-2xl font-bold">最适合色对比</h2>
            <div className="grid grid-cols-5 gap-4">
              {palette.bestColors.slice(10, 15).map((hex) => (
                <div key={hex} className="space-y-2 text-center">
                  <PortraitFrame src={report.uploadedImage} className="h-32" />
                  <div className="h-10 rounded" style={{ backgroundColor: hex }} />
                  <p className="text-xs font-semibold">{hex.toUpperCase()}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-sm italic text-[#7b6152]">柔和低饱和的暖色让肤色更均匀、自然透亮。</p>
          </div>

          <div>
            <h2 className="mb-3 border-b border-[#d8c1a8] pb-1 text-2xl font-bold">中性色对比</h2>
            <PaletteGrid colors={palette.neutrals.slice(0, 6)} labels={neutralLabels} columns={6} compact />
            <p className="mt-2 text-center text-sm italic text-[#7b6152]">暖中性底色奠定整体和谐柔光感。</p>
          </div>

          <div>
            <h2 className="mb-3 border-b border-[#d8c1a8] pb-1 text-2xl font-bold">推荐色</h2>
            <PaletteGrid colors={palette.bestColors} columns={5} />
          </div>

          <div>
            <h2 className="mb-3 border-b border-[#d8c1a8] pb-1 text-2xl font-bold">强调色</h2>
            <PaletteGrid colors={palette.accents} columns={6} compact />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <h2 className="mb-3 border-b border-[#d8c1a8] pb-1 text-2xl font-bold">避雷色</h2>
              <PaletteGrid colors={palette.avoidColors} labels={avoidLabels} columns={6} compact />
            </div>
            <div>
              <h2 className="mb-3 border-b border-[#d8c1a8] pb-1 text-2xl font-bold">次适合</h2>
              <PaletteGrid colors={palette.nearColors} labels={nearLabels} columns={6} compact />
            </div>
          </div>

          <div className="rounded-sm border border-[#e4cfb9] bg-white/45 p-4">
            <h2 className="mb-2 text-xl font-bold">关键提示</h2>
            <ul className="grid list-disc grid-cols-2 gap-x-8 gap-y-1 pl-5 text-sm leading-relaxed text-[#5a3b2c]">
              <li>选择低饱和、暖调的柔和色彩。</li>
              <li>避免高对比和冷艳色。</li>
              <li>中性色以驼色、暖灰、咖啡棕为基础。</li>
              <li>材质选择羊绒、亚麻、麂皮、细纹理。</li>
              <li>整体风格走柔和、知性、轻松高级感。</li>
              <li>金属饰品优先古金、哑光金、暖铜。</li>
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}
