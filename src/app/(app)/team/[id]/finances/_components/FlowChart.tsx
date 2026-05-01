import { formatMoney, formatMonthShort } from "@/lib/format";
import type { FlowMonth } from "./types";

export function FlowChart({ data }: { data: FlowMonth[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.collected, d.venuePaid]), 1);
  const CHART_H = 64;
  const BAR_W = 10;
  const PAIR_GAP = 2;
  const COLS = data.length;
  const COL_W = 44;
  const TOTAL_W = COLS * COL_W;
  const LABEL_PAD = 14;

  const totalCollected = data.reduce((s, d) => s + d.collected, 0);
  const totalVenue = data.reduce((s, d) => s + d.venuePaid, 0);
  const net = totalCollected - totalVenue;

  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <p className="text-[13px] font-semibold text-text-primary mb-3">
        Поток за 6 месяцев
      </p>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${CHART_H + LABEL_PAD + 14}`}
        className="w-full"
        style={{ height: `${CHART_H + LABEL_PAD + 14}px` }}
      >
        {data.map((d, idx) => {
          const colCx = idx * COL_W + COL_W / 2;
          const ch =
            d.collected > 0 ? Math.max((d.collected / maxVal) * CHART_H, 2) : 0;
          const vh =
            d.venuePaid > 0 ? Math.max((d.venuePaid / maxVal) * CHART_H, 2) : 0;
          const collectedX = colCx - BAR_W - PAIR_GAP / 2 + BAR_W / 2;
          const venueX = colCx + PAIR_GAP / 2 + BAR_W / 2;
          return (
            <g key={d.month}>
              {ch > 0 && (
                <rect
                  x={colCx - BAR_W - PAIR_GAP / 2}
                  y={LABEL_PAD + CHART_H - ch}
                  width={BAR_W}
                  height={ch}
                  rx={2}
                  fill="var(--color-primary)"
                  opacity={0.85}
                />
              )}
              {vh > 0 && (
                <rect
                  x={colCx + PAIR_GAP / 2}
                  y={LABEL_PAD + CHART_H - vh}
                  width={BAR_W}
                  height={vh}
                  rx={2}
                  fill="var(--gray-400)"
                />
              )}
              {d.collected > 0 && (
                <text
                  x={collectedX}
                  y={LABEL_PAD + CHART_H - ch - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={600}
                  fill="var(--color-primary)"
                >
                  {compactNum(d.collected)}
                </text>
              )}
              {d.venuePaid > 0 && (
                <text
                  x={venueX}
                  y={LABEL_PAD + CHART_H - vh - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={600}
                  fill="var(--text-secondary)"
                >
                  {compactNum(d.venuePaid)}
                </text>
              )}
              <text
                x={colCx}
                y={LABEL_PAD + CHART_H + 11}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-secondary)"
              >
                {formatMonthShort(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
            Сборы
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span className="w-2 h-2 rounded-sm bg-border inline-block" />
            Площадки
          </span>
        </div>
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: net >= 0 ? "var(--green-600)" : "var(--danger)" }}
        >
          Чистый: {net >= 0 ? "+" : ""}
          {formatMoney(net)}
        </span>
      </div>
    </div>
  );
}

function compactNum(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}
