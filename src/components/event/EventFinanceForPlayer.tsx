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
        className="rounded-2xl px-4 py-4"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
          {isCompleted ? "Ваш взнос" : "Стоимость с игрока"}
        </p>
        <p
          className="font-display text-[28px] font-bold leading-none mt-0.5 mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {formatMoney(pricePerPlayer)}
        </p>

        {isCompleted &&
          onTogglePaid &&
          (myPaid ? (
            <button
              type="button"
              onClick={onTogglePaid}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-transform active:scale-[0.98]"
              style={{ background: "var(--green-50)", color: "var(--green-700)" }}
            >
              ✓ Я сдал {formatMoney(pricePerPlayer)} · отменить
            </button>
          ) : (
            <button
              type="button"
              onClick={onTogglePaid}
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-transform active:scale-[0.98]"
              style={{ background: "var(--green-500)", color: "white" }}
            >
              Я сдал {formatMoney(pricePerPlayer)}
            </button>
          ))}
      </div>
    </section>
  );
}
