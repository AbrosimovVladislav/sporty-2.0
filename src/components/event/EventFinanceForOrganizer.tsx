"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type Attendance = {
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  paid_amount: number | null;
  user: { id: string; name: string };
};

type Props = {
  isCompleted: boolean;
  pricePerPlayer: number;
  venueCost: number;
  venuePaid: number;
  attendances: Attendance[];
  yesCount: number;
};

export function EventFinanceForOrganizer({
  isCompleted,
  pricePerPlayer,
  venueCost,
  venuePaid,
  attendances,
  yesCount,
}: Props) {
  const [showDebtors, setShowDebtors] = useState(false);

  const expected = isCompleted
    ? attendances.filter((a) => a.attended === true).length * pricePerPlayer
    : yesCount * pricePerPlayer;

  const collected = attendances.reduce(
    (sum, a) => sum + (a.paid ? (a.paid_amount ?? pricePerPlayer) : 0),
    0,
  );

  const debtors = isCompleted
    ? attendances.filter((a) => a.attended === true && !a.paid)
    : [];

  const venueRemaining = Math.max(0, venueCost - venuePaid);

  return (
    <section className="px-4 mt-6">
      <p
        className="text-[11px] font-semibold uppercase mb-2 px-1"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        Финансы (организатор)
      </p>

      <div className="grid grid-cols-1 gap-2.5">
        {venueCost > 0 && (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  Площадка
                </p>
                <p
                  className="font-display text-[20px] font-bold leading-tight mt-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatPrice(venueCost)}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Оплачено {formatPrice(venuePaid)}
                  {venueRemaining > 0 && ` · осталось ${formatPrice(venueRemaining)}`}
                </p>
              </div>
              <span
                className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0"
                style={
                  venueRemaining === 0
                    ? { background: "var(--green-50)", color: "var(--green-700)" }
                    : { background: "var(--gray-100)", color: "var(--text-secondary)" }
                }
              >
                {venueRemaining === 0 ? "Оплачено" : "Не оплачено"}
              </span>
            </div>
          </Card>
        )}

        {pricePerPlayer > 0 && (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  Сборы с игроков
                </p>
                <p
                  className="font-display text-[20px] font-bold leading-tight mt-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatPrice(collected)}
                  <span className="text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                    {" / "}
                    {formatPrice(expected)}
                  </span>
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {isCompleted
                    ? `${attendances.filter((a) => a.attended === true).length} участвовали`
                    : `${yesCount} собираются прийти`}
                </p>
              </div>
              {debtors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDebtors((v) => !v)}
                  className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0"
                  style={{ background: "oklch(0.95 0.06 25)", color: "var(--danger)" }}
                >
                  Должны: {debtors.length}
                </button>
              )}
            </div>
            {showDebtors && debtors.length > 0 && (
              <ul
                className="mt-3 pt-3 flex flex-col gap-1.5"
                style={{ borderTop: "1px solid var(--gray-200)" }}
              >
                {debtors.map((d) => (
                  <li
                    key={d.user_id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span style={{ color: "var(--text-primary)" }}>{d.user.name}</span>
                    <span style={{ color: "var(--danger)" }}>{formatPrice(pricePerPlayer)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
    >
      {children}
    </div>
  );
}
