interface PortraitFrameProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function PortraitFrame({ src, alt = "Uploaded portrait", className = "" }: PortraitFrameProps) {
  return (
    <div className={`relative overflow-hidden rounded-sm border border-[#e6d3bf] bg-[#f8f2ea] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover object-top" />
      ) : (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#f5d5ba_0_14%,#2b2520_15%_25%,#f6efe7_26%_100%)] text-center text-[#7b6152]">
          <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-semibold shadow-sm">Upload portrait</span>
        </div>
      )}
    </div>
  );
}
