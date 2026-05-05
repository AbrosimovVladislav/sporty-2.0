import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { Eyebrow, TrendChip } from "./atoms";
import type { Insights } from "./types";

export function FinanceCard({
  insights,
  teamId,
}: {
  insights: Insights | null | undefined;
  teamId: string;
}) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[16px] h-[120px] animate-pulse"
        style={{ background: "var(--ink-100)" }}
      />
    );
  }
  if (!insights || !insights.finance30d) return null;
  const f = insights.finance30d;
  const trend = f.netDelta - f.prevNetDelta;

  return (
    <Link
      href={`/team/${teamId}/finances`}
      className="block rounded-[16px] p-4 transition-colors active:opacity-90"
      style={{
        background: "var(--card)",
        border: "1px solid var(--ink-100)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Финансы · 30 дней</Eyebrow>
          <p
            className="font-display text-[28px] font-bold leading-none mt-2 tabular-nums"
            style={{
              color: f.netDelta >= 0 ? "var(--green-700)" : "var(--danger)",
            }}
          >
            {f.netDelta >= 0 ? "+" : ""}
            {formatMoney(f.netDelta)}
          </p>
          {f.prevNetDelta !== 0 && <TrendChip delta={trend} unit="₸" />}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <p
              className="text-[11px]"
              style={{ color: "var(--ink-400)" }}
            >
              Сборы
            </p>
            <p
              className="text-[14px] font-semibold tabular-nums"
              style={{ color: "var(--ink-900)" }}
            >
              {formatMoney(f.collected)}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[11px]"
              style={{ color: "var(--ink-400)" }}
            >
              Расходы
            </p>
            <p
              className="text-[14px] font-semibold tabular-nums"
              style={{ color: "var(--ink-900)" }}
            >
              {formatMoney(f.venuePaid)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
