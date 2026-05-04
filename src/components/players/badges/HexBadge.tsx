import type { CSSProperties, ReactNode } from "react";

const CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

type Props = {
  width?: number;
  height?: number;
  borderColor: string;
  fillFrom: string;
  fillMid?: string;
  fillTo: string;
  children?: ReactNode;
  innerStyle?: CSSProperties;
};

export function HexBadge({
  width = 26,
  height = 30,
  borderColor,
  fillFrom,
  fillMid,
  fillTo,
  children,
  innerStyle,
}: Props) {
  const gradient = fillMid
    ? `linear-gradient(to bottom, ${fillFrom} 0%, ${fillMid} 50%, ${fillTo} 100%)`
    : `linear-gradient(to bottom, ${fillFrom} 0%, ${fillTo} 100%)`;

  return (
    <div
      className="relative shrink-0"
      style={{ width, height }}
      aria-hidden
    >
      {/* outer border layer */}
      <div
        className="absolute inset-0"
        style={{ background: borderColor, clipPath: CLIP }}
      />
      {/* inner fill layer (inset 2px) + soft light overlay on top */}
      <div
        className="absolute"
        style={{
          inset: 2,
          background: gradient,
          clipPath: CLIP,
          ...innerStyle,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)",
            clipPath: CLIP,
          }}
        />
      </div>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
