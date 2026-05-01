import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { pluralize } from "@/lib/format";
import { MiniStat } from "./atoms";
import { ChevronRightIcon } from "./icons";
import type { PeekContent, ReliabilityData } from "./types";

export function peekReliability(
  d: ReliabilityData | null | undefined,
): PeekContent | null {
  if (d === undefined) {
    return {
      primary: "—",
      primaryColor: "var(--text-tertiary)",
      secondary: "Загрузка",
    };
  }
  if (!d || d.totals.votedYes + d.totals.cancelled === 0) {
    return { primary: "—", secondary: "Нет данных" };
  }
  const { reliability, noShow, cancelled } = d.totals;
  const issues: string[] = [];
  if (noShow > 0)
    issues.push(
      `${noShow} ${pluralize(noShow, ["неприход", "неприхода", "неприходов"])}`,
    );
  if (cancelled > 0)
    issues.push(
      `${cancelled} ${pluralize(cancelled, ["отмена", "отмены", "отмен"])}`,
    );

  return {
    primary: reliability !== null ? `${reliability}%` : "—",
    primaryColor:
      reliability !== null && reliability >= 90
        ? "var(--green-600)"
        : reliability !== null && reliability >= 70
          ? "var(--text-primary)"
          : "var(--danger)",
    secondary: issues.length > 0 ? issues.join(" · ") : "Без нарушений",
  };
}

export function ReliabilityBody({
  data,
  onEventClick,
}: {
  data: ReliabilityData;
  onEventClick: (eventId: string) => void;
}) {
  const { reliability, votedYes, noShow, cancelled, played } = data.totals;
  const reliabilityLabel =
    reliability === null
      ? "—"
      : reliability >= 90
        ? "Стабильный"
        : reliability >= 70
          ? "Надёжный"
          : reliability >= 50
            ? "Средняя"
            : "Низкая";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p
            className="font-display text-[28px] font-bold leading-none tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {reliability !== null ? `${reliability}%` : "—"}
          </p>
          {reliability !== null && (
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {reliabilityLabel}
            </p>
          )}
        </div>
        <p
          className="text-[12px] tabular-nums text-right"
          style={{ color: "var(--text-secondary)" }}
        >
          {played} из {votedYes} записей
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Неприходы" value={noShow} bad={noShow > 0} />
        <MiniStat label="Отмены" value={cancelled} bad={false} />
      </div>

      {data.recentEvents.length > 0 && (
        <ul
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          {data.recentEvents.map((e, i) => {
            const dotColor =
              e.attended === true
                ? "var(--green-500)"
                : e.attended === false
                  ? "var(--danger)"
                  : "var(--text-tertiary)";
            const label =
              e.attended === true
                ? e.type === "training"
                  ? "Был на тренировке"
                  : "Сыграл матч"
                : e.attended === false
                  ? e.vote === "no"
                    ? "Отменил"
                    : "Не пришёл"
                  : `Записался — ${EVENT_TYPE_LABEL[e.type] ?? e.type}`;
            return (
              <li
                key={e.event_id}
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onEventClick(e.event_id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-gray-50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: dotColor }}
                    />
                    <span
                      className="text-[13px] truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className="text-[12px] tabular-nums"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatShortDate(e.date)}
                    </span>
                    <ChevronRightIcon />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}
