import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { Eyebrow } from "./atoms";
import type { FinanceMetrics } from "./types";

export function FinanceCard({
  metrics,
  teamId,
}: {
  metrics: FinanceMetrics | null | undefined;
  teamId: string;
}) {
  if (metrics === undefined) {
    return (
      <div
        className="rounded-[16px] h-[120px] animate-pulse"
        style={{ background: "var(--ink-100)" }}
      />
    );
  }
  if (!metrics) return null;

  const positive = metrics.realBalance >= 0;

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
      <Eyebrow>Реальный баланс</Eyebrow>
      <p
        className="font-display text-[28px] font-bold leading-none mt-2 tabular-nums"
        style={{
          color: positive ? "var(--green-700)" : "var(--danger)",
        }}
      >
        {positive ? "+" : ""}
        {formatMoney(metrics.realBalance)} ₸
      </p>

      <div
        className="grid grid-cols-3 gap-2 mt-4 pt-4"
        style={{ borderTop: "1px solid var(--ink-100)" }}
      >
        <Segment label="В кассе" value={formatMoney(metrics.cash)} />
        <Segment
          label="Долг игроков"
          value={formatMoney(metrics.playersDebt)}
          danger={metrics.playersDebt > 0}
        />
        <Segment
          label="Долг площадкам"
          value={formatMoney(metrics.venueOutstanding)}
          danger={metrics.venueOutstanding > 0}
        />
      </div>
    </Link>
  );
}

function Segment({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span
        className="text-[10px] uppercase font-semibold truncate"
        style={{ letterSpacing: "0.05em", color: "var(--ink-500)" }}
      >
        {label}
      </span>
      <span
        className="text-[13px] font-semibold tabular-nums truncate"
        style={{ color: danger ? "var(--danger)" : "var(--ink-900)" }}
      >
        {value}
      </span>
    </div>
  );
}
