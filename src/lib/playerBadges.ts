export type PositionCode = "vrt" | "zash" | "pzsh" | "nap";
export type LevelCode = "aplus" | "a" | "b" | "c" | "d";

/** Design System v2 position keys (forward/midfielder/defender/goalkeeper) */
export type PositionKind = "fwd" | "mid" | "def" | "gk";

const CODE_TO_KIND: Record<PositionCode, PositionKind> = {
  nap: "fwd",
  pzsh: "mid",
  zash: "def",
  vrt: "gk",
};

export function positionKind(code: PositionCode): PositionKind {
  return CODE_TO_KIND[code];
}

const POSITION_MAP: Record<string, PositionCode> = {
  "Вратарь": "vrt",
  "Защитник": "zash",
  "Полузащитник": "pzsh",
  "Нападающий": "nap",
};

export function positionCode(position: string | null | undefined): PositionCode | null {
  if (!position) return null;
  return POSITION_MAP[position] ?? null;
}

export function positionShortLabel(code: PositionCode): string {
  return { vrt: "ВРТ", zash: "ЗАЩ", pzsh: "ПЗЩ", nap: "НАП" }[code];
}

export function levelFromRating(rating: number | null | undefined): LevelCode | null {
  if (rating == null) return null;
  if (rating >= 89) return "aplus";
  if (rating >= 73) return "a";
  if (rating >= 56) return "b";
  if (rating >= 26) return "c";
  return "d";
}

export function levelLetter(code: LevelCode): string {
  return { aplus: "A+", a: "A", b: "B", c: "C", d: "D" }[code];
}

export function levelName(code: LevelCode): string {
  return {
    aplus: "Элитный",
    a: "Продвинутый",
    b: "Уверенный",
    c: "Средний",
    d: "Начинающий",
  }[code];
}

// Детерминированный hue 0..360 из строкового id команды.
// Используется как фолбэк цвета лого, пока teams.logo_url пуст.
export function teamFallbackHue(teamId: string): number {
  let h = 0;
  for (let i = 0; i < teamId.length; i++) {
    h = (h * 31 + teamId.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

import { SKILL_LEVELS } from "./catalogs";

export function skillToNum(level: string | null | undefined): number {
  if (!level) return 0;
  const idx = SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
  return idx === -1 ? 0 : idx + 1;
}
