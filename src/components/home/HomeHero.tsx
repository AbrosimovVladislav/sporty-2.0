"use client";

import { ReactNode } from "react";

type Props = {
  name: string;
  hasRequests: boolean;
  onBellClick: () => void;
  children?: ReactNode;
};

export function HomeHero({ name, hasRequests, onBellClick, children }: Props) {
  return (
    <div
      className="relative overflow-hidden px-4 pt-4 pb-6"
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
        <div className="flex items-center justify-between mb-[18px]">
          <div>
            <div className="text-[13px] text-white/70">Привет,</div>
            <div className="text-[18px] font-bold text-white">{name || "…"}</div>
          </div>
          <button
            type="button"
            onClick={onBellClick}
            aria-label="Уведомления"
            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <BellIcon />
            {hasRequests && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ background: "#ff4444", border: "2px solid var(--green-600)" }}
              />
            )}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
