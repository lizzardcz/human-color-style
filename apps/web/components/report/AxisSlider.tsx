interface AxisSliderProps {
  label: string;
  left: string;
  right: string;
  value: number;
  gradient: string;
}

export function AxisSlider({ label, left, right, value, gradient }: AxisSliderProps) {
  const percent = Math.max(0, Math.min(100, value * 100));

  return (
    <div className="grid grid-cols-[3.75rem_1fr_1.5rem] items-center gap-3 text-xs text-[#4a2d20]">
      <span className="font-semibold">{label}</span>
      <div className="relative h-4 rounded-full shadow-inner" style={{ background: gradient }}>
        <span
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-[#9a6a43] shadow-md"
          style={{ left: `calc(${percent}% - 10px)` }}
        />
      </div>
      <div className="flex justify-between gap-1 text-[11px] text-[#7b6152]">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}
