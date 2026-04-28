"use client";

import Link from "next/link";

export function QuickActions() {
  return (
    <div className="flex gap-2.5 px-4 mt-4">
      <Link
        href="/search/events"
        className="flex-1 rounded-2xl p-4 transition-transform active:scale-[0.97]"
        style={{ background: "var(--green-500)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <SearchIcon color="white" />
        </div>
        <div className="text-[14px] font-semibold text-white">Найти событие</div>
        <div className="text-[12px] text-white/60 mt-0.5">Игры и тренировки</div>
      </Link>

      <Link
        href="/search/teams"
        className="flex-1 rounded-2xl p-4 transition-transform active:scale-[0.97]"
        style={{ background: "white", border: "1.5px solid var(--gray-200)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
          style={{ background: "var(--green-50)" }}
        >
          <SearchIcon color="var(--green-600)" />
        </div>
        <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Найти команду
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Открытые команды
        </div>
      </Link>
    </div>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
