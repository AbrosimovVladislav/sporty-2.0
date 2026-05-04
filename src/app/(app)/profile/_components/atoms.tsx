import type { CSSProperties, ReactNode } from "react";

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase ${className}`}
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-[16px] ${className}`}
      style={{
        background: "var(--bg-primary)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SkeletonBlock() {
  return (
    <div
      className="rounded-[16px] h-32 animate-pulse"
      style={{ background: "var(--bg-card)" }}
    />
  );
}
