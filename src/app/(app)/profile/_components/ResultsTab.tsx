"use client";

import type { Stats } from "./types";
import { Card, Eyebrow, SkeletonBlock } from "./atoms";

export function ResultsTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

  return (
    <>
      <Card className="px-4 pt-4 pb-5">
        <Eyebrow className="mb-2">Сыграно матчей</Eyebrow>
        <p
          className="font-display text-[48px] font-bold leading-none tabular-nums"
          style={{ color: "var(--ink-900)" }}
        >
          {stats?.playedCount ?? 0}
        </p>
      </Card>

      <Card className="p-6 text-center">
        <p
          className="text-[16px] font-bold mb-1.5"
          style={{ color: "var(--ink-900)" }}
        >
          Игровая статистика — в разработке
        </p>
        <p
          className="text-[14px] leading-normal"
          style={{ color: "var(--ink-500)" }}
        >
          Скоро ты сможешь видеть свои голы, передачи, MVP-награды и другие
          показатели за каждый матч.
        </p>
      </Card>
    </>
  );
}
