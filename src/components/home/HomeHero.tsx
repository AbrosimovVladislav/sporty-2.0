"use client";

import { ReactNode } from "react";

type Props = {
  name: string;
  city: string;
  hasRequests: boolean;
  onBellClick: () => void;
  onProfileClick: () => void;
  children?: ReactNode;
};

export function HomeHero({ name, city, hasRequests, onBellClick, onProfileClick, children }: Props) {
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
          <button
            type="button"
            onClick={onProfileClick}
            className="flex flex-col items-start active:opacity-70 transition-opacity text-left"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <MapPinIcon />
              <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                {city}
              </span>
            </div>
            <div className="text-[18px] font-bold text-white">Привет, {name || "…"}</div>
          </button>
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

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
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
