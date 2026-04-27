"use client";

import { formatMoney } from "@/lib/format";

type Props = {
  pricePerPlayer: number;
  isCompleted: boolean;
  myPaid: boolean;
  onTogglePaid?: () => void;
};

export function EventFinanceForPlayer({
  pricePerPlayer,
  isCompleted,
  myPaid,
  onTogglePaid,
}: Props) {
  if (pricePerPlayer === 0) return null;

  return (
    <section className="px-4 mt-6">
      <p
        className="text-[11px] font-semibold uppercase mb-2 px-1"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        Финансы
      </p>
      <div
        className="rounded-2xl px-4 py-4 flex items-center justify-between gap-3"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {isCompleted ? "Ваш взнос" : "Стоимость с игрока"}
          </p>
          <p
            className="font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {formatMoney(pricePerPlayer)}
          </p>
        </div>
        {isCompleted && onTogglePaid && (
          <button
            type="button"
            onClick={onTogglePaid}
            className="text-[12px] font-semibold rounded-full px-3 py-1.5 shrink-0"
            style={
              myPaid
                ? { background: "var(--green-500)", color: "white" }
                : { background: "var(--gray-100)", color: "var(--text-secondary)" }
            }
          >
            {myPaid ? "✓ Сдали" : "Отметить оплату"}
          </button>
        )}
      </div>
    </section>
  );
}
