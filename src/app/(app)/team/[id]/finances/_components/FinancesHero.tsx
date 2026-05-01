import { formatMoney } from "@/lib/format";
import type { FinancesData } from "./types";

export function FinancesHero({ metrics }: { metrics: FinancesData["metrics"] }) {
  const m = metrics;
  return (
    <div className="bg-gray-900 rounded-[16px] p-5">
      <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-white/50 mb-1.5">
        Реальный баланс
      </p>
      <span
        className={`font-display text-[40px] font-bold tabular-nums leading-none ${
          m.realBalance >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {m.realBalance >= 0 ? "+" : ""}
        {formatMoney(m.realBalance)}
      </span>
      <div className="border-t border-white/10 mt-4 pt-4 grid grid-cols-3 gap-2">
        <HeroSegment label="В кассе" value={formatMoney(m.cash)} />
        <HeroSegment
          label="Долг игроков"
          value={formatMoney(m.playersDebt)}
          danger={m.playersDebt > 0}
        />
        <HeroSegment
          label="Долг площадкам"
          value={formatMoney(m.venueOutstanding)}
          danger={m.venueOutstanding > 0}
        />
      </div>
    </div>
  );
}

function HeroSegment({
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
      <span className="text-[10px] text-white/40 uppercase tracking-[0.05em] truncate">
        {label}
      </span>
      <span
        className={`text-[13px] font-semibold tabular-nums truncate ${
          danger ? "text-red-400" : "text-white/80"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
