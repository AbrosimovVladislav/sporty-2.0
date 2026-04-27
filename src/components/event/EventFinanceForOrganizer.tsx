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

  const venuePct = venueCost > 0 ? Math.min(100, (venuePaid / venueCost) * 100) : 0;
  const collectedPct = expected > 0 ? Math.min(100, (collected / expected) * 100) : 0;

  if (venueCost === 0 && pricePerPlayer === 0) return null;

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
        {venueCost > 0 && (
          <Row
            label="Площадка"
            value={`${formatPrice(venuePaid)} / ${formatPrice(venueCost)}`}
            pct={venuePct}
            ok={venuePct >= 100}
            okLabel="Оплачено"
            partialLabel={`Осталось ${formatPrice(Math.max(0, venueCost - venuePaid))}`}
          />
        )}

        {venueCost > 0 && pricePerPlayer > 0 && (
          <div className="my-3.5" style={{ borderTop: "1px solid var(--gray-100)" }} />
        )}

        {pricePerPlayer > 0 && (
          <>
            <Row
              label="Сборы с игроков"
              value={`${formatPrice(collected)} / ${formatPrice(expected)}`}
              pct={collectedPct}
              ok={collectedPct >= 100 && expected > 0}
              okLabel="Собрано"
              partialLabel={
                isCompleted
                  ? `${attendances.filter((a) => a.attended === true).length} участвовали`
                  : `${yesCount} собираются прийти`
              }
              right={
                debtors.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowDebtors((v) => !v)}
                    className="text-[11px] font-semibold rounded-full px-2.5 py-1"
                    style={{ background: "oklch(0.95 0.06 25)", color: "var(--danger)" }}
                  >
                    Должны: {debtors.length}
                  </button>
                ) : null
              }
            />

            {showDebtors && debtors.length > 0 && (
              <ul
                className="mt-3 pt-3 flex flex-col gap-1.5"
                style={{ borderTop: "1px solid var(--gray-100)" }}
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
          </>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  pct,
  ok,
  okLabel,
  partialLabel,
  right,
}: {
  label: string;
  value: string;
  pct: number;
  ok: boolean;
  okLabel: string;
  partialLabel: string;
  right?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
          <p
            className="font-display text-[20px] font-bold leading-tight mt-0.5"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </p>
        </div>
        <div className="shrink-0">
          {right ?? (
            <span
              className="text-[11px] font-semibold rounded-full px-2.5 py-1 inline-block"
              style={
                ok
                  ? { background: "var(--green-50)", color: "var(--green-700)" }
                  : { background: "var(--gray-100)", color: "var(--text-secondary)" }
              }
            >
              {ok ? okLabel : partialLabel}
            </span>
          )}
        </div>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden mt-2"
        style={{ background: "var(--gray-100)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: ok ? "var(--green-500)" : "var(--green-400)",
          }}
        />
      </div>
    </div>
  );
}
