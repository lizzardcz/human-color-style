interface ReportHeaderProps {
  title: string;
  subtitle: string;
}

export function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  return (
    <div className="text-center text-[#3d2016]">
      <div className="flex items-center justify-center gap-4">
        <span className="h-px w-24 bg-[#c7aa8d]" />
        <h1 className="font-serif text-4xl font-bold tracking-[0.12em]">{title}</h1>
        <span className="h-px w-24 bg-[#c7aa8d]" />
      </div>
      <p className="mt-1 text-lg font-semibold tracking-[0.3em]">{subtitle}</p>
    </div>
  );
}
