/**
 * PositionTag — Design System v2.
 * Простой цветной тег позиции: иконка (PNG-mask или SVG) + 3-буквенный лейбл.
 * Высота 22, радиус 6. Цвет от `--pos-{kind}-{bg|fg}`.
 */

import {
  positionKind,
  positionShortLabel,
  type PositionCode,
  type PositionKind,
} from "@/lib/playerBadges";

type Props = {
  code: PositionCode;
};

export function PositionTag({ code }: Props) {
  const kind = positionKind(code);
  const label = positionShortLabel(code);
  return (
    <span
      className="inline-flex items-center gap-[5px] h-[22px] px-2 rounded-[6px]"
      style={{
        background: `var(--pos-${kind}-bg)`,
        color: `var(--pos-${kind}-fg)`,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <PositionGlyph kind={kind} />
      {label}
    </span>
  );
}

function PositionGlyph({ kind }: { kind: PositionKind }) {
  if (kind === "fwd") return <MaskIcon src="/badges/boot.png" />;
  if (kind === "gk") return <MaskIcon src="/badges/glove.png" />;
  if (kind === "mid") return <CrosshairSvg />;
  return <ShieldSvg />;
}

function MaskIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

function CrosshairSvg() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
    </svg>
  );
}

function ShieldSvg() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden
    >
      <path d="M12 2 3 6v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4Zm0 2.2 7 3.1v4.7c0 4.6-3.1 8.8-7 10-3.9-1.2-7-5.4-7-10V7.3l7-3.1Z" />
      <path d="M12 7 8 9v3c0 2.5 1.7 4.8 4 5.4 2.3-.6 4-2.9 4-5.4V9l-4-2Z" />
    </svg>
  );
}
