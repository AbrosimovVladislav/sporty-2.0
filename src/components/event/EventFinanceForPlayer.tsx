"use client";

import { formatPrice } from "@/lib/format";

type Props = {
  pricePerPlayer: number;
  isCompleted: boolean;
  myPaid: boolean;
};

export function EventFinanceForPlayer({ pricePerPlayer, isCompleted, myPaid }: Props) {
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
        className="rounded-2xl px-4 py-4 flex items-center justify-between"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Стоимость с игрока
          </p>
          <p
            className="font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {formatPrice(pricePerPlayer)}
          </p>
        </div>
        {isCompleted && (
          <span
            className="text-[12px] font-semibold rounded-full px-3 py-1.5"
            style={
              myPaid
                ? { background: "var(--green-50)", color: "var(--green-700)" }
                : { background: "oklch(0.95 0.06 25)", color: "var(--danger)" }
            }
          >
            {myPaid ? "Оплачено" : "Не оплачено"}
          </span>
        )}
      </div>
    </section>
  );
}
