import { ColorChip } from "./ColorChip";

interface PaletteGridProps {
  colors: string[];
  labels?: string[];
  columns?: number;
  compact?: boolean;
}

export function PaletteGrid({ colors, labels, columns = 5, compact = false }: PaletteGridProps) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {colors.map((hex, index) => (
        <ColorChip key={`${hex}-${index}`} hex={hex} label={labels?.[index]} compact={compact} />
      ))}
    </div>
  );
}
