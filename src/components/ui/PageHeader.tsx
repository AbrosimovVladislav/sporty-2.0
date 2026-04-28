"use client";

import { ReactNode } from "react";

type Props = {
  title?: string;
  titleSlot?: ReactNode;
  subtitle?: string;
  /** Optional 56px slot rendered before the title (e.g. team logo) */
  leadingSlot?: ReactNode;
  onBellClick?: () => void;
  hasBellDot?: boolean;
  bellAriaLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  title,
  titleSlot,
  subtitle,
  leadingSlot,
  onBellClick,
  hasBellDot,
  bellAriaLabel = "Уведомления",
  actions,
  children,
}: Props) {
  const titleBlockMb = children ? "mb-[18px]" : "";

  return (
    <div
      className="relative overflow-hidden px-4 pt-5 pb-5"
      style={{
        background: "var(--green-600)",
        borderRadius: "0 0 28px 28px",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(120deg, transparent, transparent 30px, rgba(255,255,255,0.03) 30px, rgba(255,255,255,0.03) 32px)",
        }}
      />
      <div className="relative">
        <div className={`flex items-start gap-3${titleBlockMb ? ` ${titleBlockMb}` : ""}`}>
          {leadingSlot}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              {titleSlot ?? (
                <h1
                  className="font-display font-bold uppercase text-white text-[30px] leading-none truncate"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {title}
                </h1>
              )}
              <div className="flex items-center gap-2 shrink-0">
                {actions}
                {onBellClick && (
                  <button
                    type="button"
                    onClick={onBellClick}
                    aria-label={bellAriaLabel}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <BellIcon />
                    {hasBellDot && (
                      <span
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                        style={{ background: "#ff4444", border: "2px solid var(--green-600)" }}
                      />
                    )}
                  </button>
                )}
              </div>
            </div>
            {subtitle && (
              <p
                className="text-[13px] mt-1.5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function HeaderStatGroup({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex gap-2.5 rounded-[16px]"
      style={{
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "16px 14px",
      }}
    >
      {children}
    </div>
  );
}

export function HeaderStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-start min-w-0">
      <span className="font-display text-[34px] font-bold text-white tabular-nums leading-none">
        {value}
      </span>
      <span
        className="text-[11px] mt-1 leading-[1.3] truncate w-full"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function HeaderActionButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-full text-white text-[13px] font-semibold transition-transform active:scale-95"
      style={{ background: "rgba(255,255,255,0.18)", letterSpacing: "0.01em" }}
    >
      {children}
    </button>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
