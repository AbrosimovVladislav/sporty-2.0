import { formatMoney } from "@/lib/format";

export function MetricsBreakdown({
  collected,
  venueCost,
}: {
  collected: number;
  venueCost: number;
}) {
  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <p
        className="text-[11px] uppercase tracking-[0.06em] font-semibold mb-3"
        style={{ color: "var(--text-tertiary)" }}
      >
        Сводка
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <MetricCell
          label="Собрано за всё время"
          value={formatMoney(collected)}
          accent={collected > 0}
        />
        <MetricCell label="Расходы на площадки" value={formatMoney(venueCost)} />
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{
          color: accent ? "var(--color-primary)" : "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
