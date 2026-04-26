import { ReactNode } from "react";
import Image from "next/image";

type Props = {
  src?: string | null;
  fallback?: "event" | "team";
  statusPills?: ReactNode[];
  overlayContent?: ReactNode;
  className?: string;
};

const fallbackGradients = {
  event: "bg-gradient-to-br from-foreground to-foreground-secondary",
  team: "bg-gradient-to-br from-primary to-primary-hover",
};

export function PhotoBanner({ src, fallback = "event", statusPills, overlayContent, className = "" }: Props) {
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {src ? (
        <Image src={src} alt="" width={800} height={500} className="w-full aspect-[16/10] object-cover" />
      ) : (
        <div className={`w-full aspect-[16/10] ${fallbackGradients[fallback]}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {statusPills && statusPills.length > 0 && (
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {statusPills.map((pill, i) => (
            <span key={i}>{pill}</span>
          ))}
        </div>
      )}
      {overlayContent && (
        <div className="absolute bottom-3 left-4 right-4 text-foreground-on-dark">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
