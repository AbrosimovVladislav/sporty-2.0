"use client";

import { CircularProgress } from "@/components/CircularProgress";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import type { Stats } from "./types";
import { Eyebrow, SkeletonBlock, StatTile } from "./atoms";

export function ReliabilityTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

  const reliability = stats?.reliability ?? null;
  const hasData = !!stats && stats.votedYesCount > 0;
  const missed = hasData ? stats!.votedYesCount - stats!.attendedCount : 0;
  const missRate =
    hasData && stats!.votedYesCount > 0
      ? Math.round(
          ((stats!.votedYesCount - stats!.attendedCount) /
            stats!.votedYesCount) *
            100,
        )
      : 0;
  const attendedPct =
    hasData && stats!.votedYesCount > 0
      ? Math.round((stats!.attendedCount / stats!.votedYesCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[16px] p-5"
        style={{ background: "var(--bg-primary)" }}
      >
        <Eyebrow>Индекс надёжности</Eyebrow>
        {!hasData ? (
          <p
            className="text-[15px] mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Появится после первых завершённых событий
          </p>
        ) : (
          <div className="flex items-center justify-between mt-2">
            <div>
              <p
                className="font-display text-[40px] leading-none font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {reliability !== null ? reliability : "—"}
                <span
                  className="text-[20px] ml-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  %
                </span>
              </p>
              {reliability !== null && (
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {reliabilityLabel(reliability)}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <CircularProgress
                value={reliability ?? 0}
                size={72}
                strokeWidth={7}
              />
            </div>
          </div>
        )}
      </div>

      {hasData && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Неприходы"
              value={missed}
              tone={missed === 0 ? "good" : "default"}
            />
            <StatTile
              label="Отмены"
              value={`${missRate}%`}
              tone={missRate === 0 ? "good" : "default"}
            />
          </div>

          <div
            className="rounded-[16px] p-4"
            style={{ background: "var(--bg-primary)" }}
          >
            <Eyebrow>Посещаемость</Eyebrow>
            <div className="flex items-center justify-between mt-2 mb-2">
              <span
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                из записанных событий
              </span>
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stats!.attendedCount} / {stats!.votedYesCount}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-card)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${attendedPct}%`,
                  background: "var(--green-500)",
                }}
              />
            </div>
            <p
              className="text-[13px] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {attendedPct}%
            </p>
          </div>
        </>
      )}

      {stats && stats.recentEvents.length > 0 && (
        <div>
          <Eyebrow>Последние события</Eyebrow>
          <ul
            className="mt-2 rounded-[16px] overflow-hidden"
            style={{ background: "var(--bg-primary)" }}
          >
            {stats.recentEvents.map((e, i) => {
              const dotColor =
                e.attended === true
                  ? "var(--green-500)"
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
              return (
                <li
                  key={e.event_id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                  style={{
                    borderTop:
                      i === 0 ? undefined : "1px solid var(--gray-100)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: dotColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[15px] truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatAbsoluteDate(e.date)} · {typeLabel}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[13px] font-semibold shrink-0"
                    style={{
                      color:
                        e.attended === true
                          ? "var(--green-600)"
                          : e.attended === false
                            ? "var(--danger)"
                            : "var(--text-tertiary)",
                    }}
                  >
                    {statusLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
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
