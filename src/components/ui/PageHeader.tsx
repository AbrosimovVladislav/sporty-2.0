"use client";

import { ReactNode } from "react";
import BackButton from "@/components/BackButton";

type Props = {
  title?: string;
  titleSlot?: ReactNode;
  subtitle?: string;
  /** Optional 56px slot rendered before the title (e.g. team logo) */
  leadingSlot?: ReactNode;
  showBack?: boolean;
  fallbackHref?: string;
  onSettingsClick?: () => void;
  hasSettingsDot?: boolean;
  settingsAriaLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  title,
  titleSlot,
  subtitle,
  leadingSlot,
  showBack,
  fallbackHref = "/",
  onSettingsClick,
  hasSettingsDot,
  settingsAriaLabel = "Настройки",
  actions,
  children,
}: Props) {
  const titleBlockMb = children ? "mb-[18px]" : "";
  const hasTopRight = !!actions || !!onSettingsClick;

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
      {hasTopRight && (
        <div className="absolute top-5 right-4 flex items-center gap-2 z-10">
          {actions}
          {onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              aria-label={settingsAriaLabel}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <GearIcon />
              {hasSettingsDot && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ background: "#ff4444", border: "2px solid var(--green-600)" }}
                />
              )}
            </button>
          )}
        </div>
      )}
      <div className="relative">
        <div className={`flex items-center gap-3${titleBlockMb ? ` ${titleBlockMb}` : ""}`}>
          {showBack && (
            <BackButton
              fallbackHref={fallbackHref}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white bg-black/25 backdrop-blur-sm"
            />
          )}
          {leadingSlot}
          <div className={`flex-1 min-w-0${hasTopRight ? " pr-12" : ""}`}>
            {titleSlot ?? (
              <h1
                className="font-display font-bold uppercase text-white text-[30px] leading-none truncate"
                style={{ letterSpacing: "0.02em" }}
              >
                {title}
              </h1>
            )}
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

function GearIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
