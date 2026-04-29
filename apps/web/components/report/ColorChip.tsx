import { readableTextColor } from "@/lib/report";

interface ColorChipProps {
  hex: string;
  label?: string;
  compact?: boolean;
}

export function ColorChip({ hex, label, compact = false }: ColorChipProps) {
  return (
    <div
      className={`flex min-w-0 flex-col justify-end rounded-[6px] border border-[#eadbc8] shadow-sm ${
        compact ? "h-14 p-1.5" : "h-20 p-2"
      }`}
      style={{ backgroundColor: hex, color: readableTextColor(hex) }}
    >
      {label ? <span className="truncate text-[10px] font-semibold leading-tight">{label}</span> : null}
      <span className="truncate text-[10px] opacity-90">{hex.toUpperCase()}</span>
    </div>
  );
}
