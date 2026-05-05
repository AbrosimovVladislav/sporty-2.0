"use client";

import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import type { Stats } from "./types";
import { Card, Eyebrow, SkeletonBlock } from "./atoms";

export function ResultsTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

  const playedCount = stats?.playedCount ?? 0;
  const reliability = stats?.reliability ?? null;
  const hasReliabilityData = !!stats && stats.votedYesCount > 0;
  const noShows = hasReliabilityData
    ? stats!.votedYesCount - stats!.attendedCount
    : 0;
  const cancellationsPct =
    hasReliabilityData && stats!.votedYesCount > 0
      ? Math.round((noShows / stats!.votedYesCount) * 100)
      : 0;
  const attendedPct =
    hasReliabilityData && stats!.votedYesCount > 0
      ? Math.round((stats!.attendedCount / stats!.votedYesCount) * 100)
      : 0;

  return (
    <>
      <Card className="p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow className="mb-2">Сыграно матчей</Eyebrow>
          <p
            className="font-display text-[44px] font-bold leading-none tabular-nums"
            style={{ color: "var(--ink-900)" }}
          >
            {playedCount}
          </p>
        </div>
        <BallIcon />
      </Card>

      <Card className="p-5">
        <Eyebrow className="mb-3">Индекс надёжности</Eyebrow>
        {!hasReliabilityData ? (
          <p
            className="text-[15px]"
            style={{ color: "var(--ink-500)" }}
          >
            Появится после первых завершённых событий
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-display text-[44px] font-bold leading-none tabular-nums"
                  style={{ color: "var(--ink-900)" }}
                >
                  {reliability ?? 0}
                </span>
                <span
                  className="font-display text-[22px] font-bold"
                  style={{ color: "var(--ink-500)" }}
                >
                  %
                </span>
              </div>
              <p
                className="text-[14px] mt-1"
                style={{ color: "var(--ink-500)" }}
              >
                {reliabilityLabel(reliability ?? 0)}
              </p>
            </div>
            <ReliabilityCircle percent={reliability ?? 0} />
          </div>
        )}
      </Card>

      {hasReliabilityData && (
        <>
          <div className="flex gap-3">
            <Card className="flex-1 px-4 py-3.5">
              <Eyebrow className="mb-1.5">Неприходы</Eyebrow>
              <p
                className="font-display text-[28px] font-bold leading-none tabular-nums"
                style={{ color: "var(--ink-900)" }}
              >
                {noShows}
              </p>
            </Card>
            <Card className="flex-1 px-4 py-3.5">
              <Eyebrow className="mb-1.5">Отмены</Eyebrow>
              <p
                className="font-display text-[28px] font-bold leading-none tabular-nums"
                style={{ color: "var(--ink-900)" }}
              >
                {cancellationsPct}%
              </p>
            </Card>
          </div>

          <Card className="p-4">
            <Eyebrow className="mb-2.5">Посещаемость</Eyebrow>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[14px]"
                style={{ color: "var(--ink-500)" }}
              >
                из записанных событий
              </span>
              <span
                className="font-display text-[22px] font-bold tabular-nums"
                style={{ color: "var(--ink-900)" }}
              >
                {stats!.attendedCount} / {stats!.votedYesCount}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--ink-100)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${attendedPct}%`,
                  background: "var(--green-700)",
                }}
              />
            </div>
            <p
              className="text-[13px] mt-1.5"
              style={{ color: "var(--ink-500)" }}
            >
              {attendedPct}%
            </p>
          </Card>
        </>
      )}

      {stats && stats.recentEvents.length > 0 && (
        <div className="mt-1">
          <Eyebrow className="mb-2.5">Последние события</Eyebrow>
          <Card className="overflow-hidden">
            {stats.recentEvents.map((e, i, arr) => {
              const dotColor =
                e.attended === true
                  ? "var(--green-700)"
                  : e.attended === false
                    ? "var(--danger)"
                    : "var(--ink-400)";
              const statusLabel =
                e.attended === true
                  ? "Был"
                  : e.attended === false
                    ? "Не был"
                    : "Не голосовал";
              const typeLabel = EVENT_TYPE_LABEL[e.type] ?? e.type;
              const isLast = i === arr.length - 1;
              return (
                <div
                  key={e.event_id}
                  className="flex items-center gap-2.5 px-4 py-3.5"
                  style={{
                    borderBottom: isLast
                      ? undefined
                      : "1px solid var(--ink-100)",
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />
                  <p className="flex-1 text-[15px] truncate">
                    <span style={{ color: "var(--ink-900)" }}>
                      {formatAbsoluteDate(e.date)}
                    </span>
                    <span style={{ color: "var(--ink-400)" }}> · </span>
                    <span style={{ color: "var(--ink-900)" }}>
                      {typeLabel}
                    </span>
                  </p>
                  <span
                    className="text-[14px] font-semibold shrink-0"
                    style={{ color: dotColor }}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      <Card className="p-5 text-center">
        <p
          className="text-[15px] font-bold mb-1.5"
          style={{ color: "var(--ink-900)" }}
        >
          Игровая статистика — в разработке
        </p>
        <p
          className="text-[13px] leading-normal"
          style={{ color: "var(--ink-500)" }}
        >
          Скоро появятся голы, передачи и MVP-награды за каждый матч.
        </p>
      </Card>
    </>
  );
}

function ReliabilityCircle({ percent }: { percent: number }) {
  const size = 80;
  const stroke = 5;
  const r = (size - stroke - 3) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, percent));
  const offset = circ - (value / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
      className="shrink-0"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--ink-100)"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--green-700)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function reliabilityLabel(r: number): string {
  if (r >= 90) return "Стабильный игрок";
  if (r >= 70) return "Надёжный";
  if (r >= 50) return "Средняя надёжность";
  return "Низкая надёжность";
}

function formatAbsoluteDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function BallIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-300)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <polygon
        points="12,8 15,10.2 13.9,13.7 10.1,13.7 9,10.2"
        fill="var(--ink-200)"
        stroke="none"
      />
      <line x1="12" y1="3" x2="12" y2="8" />
      <line x1="20.3" y1="9" x2="15" y2="10.2" />
      <line x1="3.7" y1="9" x2="9" y2="10.2" />
      <line x1="18.5" y1="18.5" x2="13.9" y2="13.7" />
      <line x1="5.5" y1="18.5" x2="10.1" y2="13.7" />
    </svg>
  );
}
