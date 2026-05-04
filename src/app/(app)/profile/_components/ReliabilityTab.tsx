"use client";

import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import type { Stats } from "./types";
import { Card, Eyebrow, SkeletonBlock } from "./atoms";

export function ReliabilityTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

  const reliability = stats?.reliability ?? null;
  const hasData = !!stats && stats.votedYesCount > 0;
  const noShows = hasData ? stats!.votedYesCount - stats!.attendedCount : 0;
  const cancellationsPct =
    hasData && stats!.votedYesCount > 0
      ? Math.round((noShows / stats!.votedYesCount) * 100)
      : 0;
  const attendedPct =
    hasData && stats!.votedYesCount > 0
      ? Math.round((stats!.attendedCount / stats!.votedYesCount) * 100)
      : 0;

  return (
    <>
      <Card className="p-5">
        <Eyebrow className="mb-3">Индекс надёжности</Eyebrow>
        {!hasData ? (
          <p
            className="text-[15px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Появится после первых завершённых событий
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-display text-[48px] font-bold leading-none tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {reliability ?? 0}
                </span>
                <span
                  className="font-display text-[24px] font-bold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  %
                </span>
              </div>
              <p
                className="text-[14px] mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {reliabilityLabel(reliability ?? 0)}
              </p>
            </div>
            <ReliabilityCircle percent={reliability ?? 0} />
          </div>
        )}
      </Card>

      {hasData && (
        <>
          <div className="flex gap-3">
            <Card className="flex-1 px-4 py-3.5">
              <Eyebrow className="mb-1.5">Неприходы</Eyebrow>
              <p
                className="font-display text-[32px] font-bold leading-none tabular-nums"
                style={{ color: "var(--primary)" }}
              >
                {noShows}
              </p>
            </Card>
            <Card className="flex-1 px-4 py-3.5">
              <Eyebrow className="mb-1.5">Отмены</Eyebrow>
              <p
                className="font-display text-[32px] font-bold leading-none tabular-nums"
                style={{ color: "var(--primary)" }}
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
                style={{ color: "var(--text-secondary)" }}
              >
                из записанных событий
              </span>
              <span
                className="font-display text-[24px] font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stats!.attendedCount} / {stats!.votedYesCount}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--green-100)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${attendedPct}%`,
                  background: "var(--green-600)",
                }}
              />
            </div>
            <p
              className="text-[13px] mt-1.5"
              style={{ color: "var(--text-secondary)" }}
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
                  ? "var(--green-600)"
                  : e.attended === false
                    ? "var(--danger)"
                    : "var(--text-tertiary)";
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
                      : "1px solid var(--gray-100)",
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />
                  <p className="flex-1 text-[15px] truncate">
                    <span style={{ color: "var(--text-primary)" }}>
                      {formatAbsoluteDate(e.date)}
                    </span>
                    <span style={{ color: "var(--text-tertiary)" }}> · </span>
                    <span style={{ color: "var(--text-primary)" }}>
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
        stroke="var(--green-100)"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--green-600)"
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
