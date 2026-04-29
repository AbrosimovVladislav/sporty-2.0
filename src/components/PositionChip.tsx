"use client";

type Tone = "light" | "dark";

const POSITION_MAP: Record<string, { short: string; light: string; dark: string }> = {
  Вратарь: {
    short: "ВРТ",
    light: "bg-amber-100 text-amber-700",
    dark: "bg-amber-500/20 text-amber-200",
  },
  Защитник: {
    short: "ЗАЩ",
    light: "bg-blue-100 text-blue-700",
    dark: "bg-blue-500/20 text-blue-200",
  },
  Полузащитник: {
    short: "ПЗЩ",
    light: "bg-emerald-100 text-emerald-700",
    dark: "bg-emerald-500/20 text-emerald-200",
  },
  Нападающий: {
    short: "НАП",
    light: "bg-red-100 text-red-700",
    dark: "bg-red-500/20 text-red-200",
  },
};

export function PositionChip({ position, tone = "light" }: { position: string; tone?: Tone }) {
  const cfg = POSITION_MAP[position];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold rounded px-1.5 py-0.5 leading-none tracking-wider shrink-0 ${tone === "dark" ? cfg.dark : cfg.light}`}
    >
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
