import { formatMoney } from "@/lib/format";
import { MiniStat } from "./atoms";
import { ChevronRightIcon } from "./icons";
import type { FinancesData, PeekContent } from "./types";

export function peekFinances(
  d: FinancesData | null | undefined,
): PeekContent | null {
  if (d === undefined) {
    return {
      primary: "—",
      primaryColor: "var(--text-tertiary)",
      secondary: "Загрузка",
    };
  }
  if (!d) return null;
  const { expected, paid, balance } = d.totals;
  const positiveBalance = balance >= 0;
  const balanceStr =
    balance === 0
      ? "0 ₸"
      : `${positiveBalance ? "+" : "−"}${formatMoney(Math.abs(balance))} ₸`;

  return {
    primary: balanceStr,
    primaryColor: positiveBalance ? "var(--green-600)" : "var(--danger)",
    secondary: `Сдал ${formatMoney(paid)} из ${formatMoney(expected)} ₸`,
  };
}

export function FinancesBody({
  data,
  onEventClick,
}: {
  data: FinancesData;
  onEventClick: (eventId: string) => void;
}) {
  const { expected, paid, balance } = data.totals;
  const positiveBalance = balance >= 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div>
          <p
            className="text-[11px] uppercase font-semibold"
            style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
          >
            {positiveBalance ? "Переплата" : "Долг"}
          </p>
          <p
            className="font-display text-[28px] font-bold leading-none tabular-nums"
            style={{
              color: positiveBalance ? "var(--green-600)" : "var(--danger)",
            }}
          >
            {formatMoney(Math.abs(balance))} ₸
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Должен сдать" value={`${formatMoney(expected)} ₸`} />
        <MiniStat label="Сдал" value={`${formatMoney(paid)} ₸`} />
      </div>

      {data.history.length > 0 && (
        <ul
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          {data.history.slice(0, 8).map((h, i) => {
            const clickable = !!h.event_id;
            const inner = (
              <>
                <span
                  className="text-[13px] truncate min-w-0 mr-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {h.label}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{
                      color:
                        h.type === "deposit"
                          ? "var(--green-600)"
                          : "var(--text-primary)",
                    }}
                  >
                    +{formatMoney(h.amount)} ₸
                  </span>
                  {clickable && <ChevronRightIcon />}
                </div>
              </>
            );
            return (
              <li
                key={h.id}
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                }}
              >
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onEventClick(h.event_id!)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-gray-50"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
