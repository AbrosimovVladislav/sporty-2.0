"use client";

import type { ReactNode } from "react";

type Tone = "light" | "dark";

type PositionConfig = {
  short: string;
  light: string;
  dark: string;
  icon: ReactNode;
};

const POSITION_MAP: Record<string, PositionConfig> = {
  Вратарь: {
    short: "ВРТ",
    light: "bg-amber-100 text-amber-700",
    dark: "bg-amber-500/20 text-amber-200",
    icon: <GlovesIcon />,
  },
  Защитник: {
    short: "ЗАЩ",
    light: "bg-blue-100 text-blue-700",
    dark: "bg-blue-500/20 text-blue-200",
    icon: <ShieldIcon />,
  },
  Полузащитник: {
    short: "ПЗЩ",
    light: "bg-emerald-100 text-emerald-700",
    dark: "bg-emerald-500/20 text-emerald-200",
    icon: <SwapIcon />,
  },
  Нападающий: {
    short: "НАП",
    light: "bg-red-100 text-red-700",
    dark: "bg-red-500/20 text-red-200",
    icon: <FlameIcon />,
  },
};

export function PositionChip({ position, tone = "light" }: { position: string; tone?: Tone }) {
  const cfg = POSITION_MAP[position];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-1.5 py-1 leading-none tracking-wider shrink-0 ${tone === "dark" ? cfg.dark : cfg.light}`}
    >
      {cfg.icon}
      {cfg.short}
    </span>
  );
}

export function PositionChipList({ positions, tone = "light" }: { positions: string[] | null | undefined; tone?: Tone }) {
  if (!positions || positions.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {positions.map((p) => (
        <PositionChip key={p} position={p} tone={tone} />
      ))}
    </span>
  );
}

/* ─── Icons ────────────────────────────────────────────────── */

const ICON_PROPS = {
  width: 11,
  height: 11,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function GlovesIcon() {
  // Hand / gloves — a stylised mitten silhouette for goalkeeper
  return (
    <svg {...ICON_PROPS}>
      <path d="M7 11V6a2 2 0 0 1 4 0v5" />
      <path d="M11 8V4a2 2 0 0 1 4 0v7" />
      <path d="M15 7a2 2 0 0 1 4 0v9a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5v-4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" />
    </svg>
  );
}

function SwapIcon() {
  // Two opposing arrows — connector between defense and attack
  return (
    <svg {...ICON_PROPS}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1.5 1-2.5 1-4 0 0 3 .5 3 4" />
      <path d="M12 22a6 6 0 0 0 6-6c0-2-1-4-2-5-1 2-2 3-4 3-2 0-3-1-4-3-1 1-2 3-2 5a6 6 0 0 0 6 6z" />
    </svg>
  );
}
