"use client";

import type { Stats } from "./types";
import { Eyebrow, SkeletonBlock } from "./atoms";

export function ResultsTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[16px] p-5"
        style={{ background: "var(--bg-primary)" }}
      >
        <Eyebrow>Сыграно матчей</Eyebrow>
        <p
          className="font-display text-[40px] leading-none font-bold tabular-nums mt-2"
          style={{ color: "var(--text-primary)" }}
        >
          {stats?.playedCount ?? 0}
        </p>
      </div>

      <div
        className="rounded-[16px] p-5"
        style={{ background: "var(--bg-primary)" }}
      >
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          🏗 Игровая статистика — в разработке
        </p>
        <p
          className="text-[13px] mt-1.5 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Скоро ты сможешь видеть свои голы, передачи, MVP-награды и другие
          показатели за каждый матч.
        </p>
      </div>
    </div>
  );
}
