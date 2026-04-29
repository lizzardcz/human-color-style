import type { GeneratedLook } from "@/lib/report";

interface LookCardProps {
  look: GeneratedLook;
  index: number;
}

export function LookCard({ look, index }: LookCardProps) {
  return (
    <div className="overflow-hidden rounded-md border border-[#eadbc8] bg-white shadow-sm">
      <div
        className="relative flex h-44 items-end justify-center overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${look.color}, #f6eadb 70%)` }}
      >
        {look.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={look.imageUrl} alt={look.title} className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : (
          <>
            <div className="absolute top-4 h-16 w-16 rounded-full bg-[#f0c9ad] shadow-[0_0_0_10px_rgba(255,255,255,0.35)]" />
            <div className="absolute top-16 h-20 w-24 rounded-t-full bg-[#2b2520]" />
            <div className="h-28 w-28 rounded-t-[3rem] border border-white/40 shadow-xl" style={{ backgroundColor: look.color }} />
          </>
        )}
        <div className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-[#4a2d20]">
          {index + 1}
        </div>
      </div>
      <div className="space-y-1 p-2 text-center">
        <p className="text-xs font-bold text-[#4a2d20]">{look.title}</p>
        <p className="text-[10px] leading-snug text-[#7b6152]">{look.subtitle}</p>
      </div>
    </div>
  );
}
