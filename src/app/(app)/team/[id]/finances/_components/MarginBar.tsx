import { formatMoney } from "@/lib/format";

export function MarginBar({
  collected,
  venuePaid,
}: {
  collected: number;
  venuePaid: number;
}) {
  const net = collected - venuePaid;
  const total = Math.max(collected + venuePaid, 1);
  const collectedPct = (collected / total) * 100;
  const venuePct = (venuePaid / total) * 100;
  const collectedPctRound = Math.round(collectedPct);
  const venuePctRound = Math.round(venuePct);

  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[14px] font-semibold text-text-primary">
          Маржинальность
        </p>
        <span
          className="font-display text-[18px] font-bold tabular-nums"
          style={{ color: net >= 0 ? "var(--green-600)" : "var(--danger)" }}
        >
          {net >= 0 ? "+" : ""}
          {formatMoney(net)}
        </span>
      </div>

      <div
        className="h-3 rounded-full overflow-hidden flex"
        style={{ background: "var(--gray-100)" }}
      >
        {collectedPct > 0 && (
          <div
            className="h-full"
            style={{
              width: `${collectedPct}%`,
              background: "var(--color-primary)",
            }}
          />
        )}
        {venuePct > 0 && (
          <div
            className="h-full"
            style={{ width: `${venuePct}%`, background: "var(--gray-400)" }}
          />
        )}
      </div>

      <div className="flex justify-between mt-2 text-[12px]">
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary tabular-nums">
            {formatMoney(collected)}
          </span>
          <span className="text-text-secondary">
            сборы ·{" "}
            <span className="tabular-nums">{collectedPctRound}%</span>
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-semibold text-text-primary tabular-nums">
            {formatMoney(venuePaid)}
          </span>
          <span className="text-text-secondary">
            расходы · <span className="tabular-nums">{venuePctRound}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
