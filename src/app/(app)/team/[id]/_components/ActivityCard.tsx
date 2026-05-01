import { Eyebrow, TrendChip } from "./atoms";
import type { Insights } from "./types";

export function ActivityCard({
  insights,
}: {
  insights: Insights | null | undefined;
}) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[16px] h-[156px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights) return null;
  const a = insights.activity;
  if (a.eventsCount === 0 && a.eventsCountPrev === 0) return null;

  const trend = a.eventsCount - a.eventsCountPrev;
  const maxCount = Math.max(1, ...a.eventsByWeek.map((w) => w.count));

  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <Eyebrow>Активность · 30 дней</Eyebrow>
          <p
            className="font-display text-[28px] font-bold leading-none mt-2 tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {a.eventsCount}
            <span
              className="text-[14px] font-normal ml-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {a.eventsCount === 1
                ? "событие"
                : a.eventsCount < 5
                  ? "события"
                  : "событий"}
            </span>
          </p>
          {a.eventsCountPrev > 0 && <TrendChip delta={trend} unit="" />}
        </div>
        {a.attendanceAvg > 0 && (
          <div className="text-right">
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
            >
              Явка
            </p>
            <p
              className="font-display text-[22px] font-bold leading-none mt-1 tabular-nums"
              style={{ color: "var(--green-600)" }}
            >
              {a.attendanceAvg}%
            </p>
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5 h-12">
        {a.eventsByWeek.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-[4px]"
              style={{
                height: `${Math.max(4, (w.count / maxCount) * 32)}px`,
                background:
                  w.count > 0 ? "var(--green-500)" : "var(--gray-200)",
              }}
            />
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "var(--text-tertiary)" }}
            >
              {w.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
