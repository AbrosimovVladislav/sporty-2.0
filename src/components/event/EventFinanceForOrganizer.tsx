"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

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
  onPatch: (body: Record<string, unknown>) => Promise<void>;
};

export function EventFinanceForOrganizer({
  isCompleted,
  pricePerPlayer,
  venueCost,
  venuePaid,
  attendances,
  yesCount,
  onPatch,
}: Props) {
  const [showDebtors, setShowDebtors] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  const [costInput, setCostInput] = useState(String(venueCost));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCostInput(String(venueCost));
  }, [venueCost]);

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

  const venueFullyPaid = venueCost > 0 && venuePaid >= venueCost;
  const venuePct = venueCost > 0 ? Math.min(100, (venuePaid / venueCost) * 100) : 0;
  const collectedPct = expected > 0 ? Math.min(100, (collected / expected) * 100) : 0;

  async function saveCost() {
    setSaving(true);
    try {
      await onPatch({ venue_cost: parseFloat(costInput) || 0 });
      setEditingCost(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVenuePaid() {
    setSaving(true);
    try {
      await onPatch({ venue_paid: venueFullyPaid ? 0 : venueCost });
    } finally {
      setSaving(false);
    }
  }

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
        {/* Площадка */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                Площадка
              </p>
              {editingCost ? (
                <div className="flex gap-2 mt-1.5 items-center">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    autoFocus
                    className="font-display text-[20px] font-bold leading-tight w-full outline-none"
                    style={{
                      color: "var(--text-primary)",
                      background: "transparent",
                      borderBottom: "1.5px solid var(--green-500)",
                    }}
                  />
                  <span
                    className="font-display text-[20px] font-bold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    ₸
                  </span>
                </div>
              ) : (
                <p
                  className="font-display text-[20px] font-bold leading-tight mt-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {venueCost === 0 ? "Не указана" : formatMoney(venueCost)}
                </p>
              )}
            </div>
            <div className="shrink-0">
              {editingCost ? (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={saveCost}
                    disabled={saving}
                    className="text-[12px] font-semibold rounded-full px-3 py-1 disabled:opacity-50"
                    style={{ background: "var(--green-500)", color: "white" }}
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCost(false);
                      setCostInput(String(venueCost));
                    }}
                    className="text-[12px] font-semibold rounded-full px-3 py-1"
                    style={{ background: "var(--gray-100)", color: "var(--text-secondary)" }}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingCost(true)}
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--green-600)" }}
                >
                  {venueCost === 0 ? "Указать" : "Изменить"}
                </button>
              )}
            </div>
          </div>

          {venueCost > 0 && !editingCost && (
            <>
              <div
                className="h-1.5 rounded-full overflow-hidden mt-2"
                style={{ background: "var(--gray-100)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${venuePct}%`,
                    background: venueFullyPaid ? "var(--green-500)" : "var(--green-400)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  {venueFullyPaid
                    ? `Оплачено ${formatMoney(venuePaid)}`
                    : `Оплачено ${formatMoney(venuePaid)} · осталось ${formatMoney(Math.max(0, venueCost - venuePaid))}`}
                </p>
                <button
                  type="button"
                  onClick={toggleVenuePaid}
                  disabled={saving}
                  className="text-[11px] font-semibold rounded-full px-2.5 py-1 disabled:opacity-50"
                  style={
                    venueFullyPaid
                      ? { background: "var(--green-50)", color: "var(--green-700)" }
                      : { background: "var(--gray-100)", color: "var(--text-secondary)" }
                  }
                >
                  {venueFullyPaid ? "✓ Оплачено" : "Отметить оплату"}
                </button>
              </div>
            </>
          )}
        </div>

        {pricePerPlayer > 0 && (
          <>
            <div className="my-3.5" style={{ borderTop: "1px solid var(--gray-100)" }} />

            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Сборы с игроков
                  </p>
                  <p
                    className="font-display text-[20px] font-bold leading-tight mt-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {isCompleted
                      ? `${formatMoney(collected)} / ${formatMoney(expected)}`
                      : formatMoney(expected)}
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

              {isCompleted && expected > 0 && (
                <div
                  className="h-1.5 rounded-full overflow-hidden mt-2"
                  style={{ background: "var(--gray-100)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${collectedPct}%`,
                      background:
                        collectedPct >= 100 ? "var(--green-500)" : "var(--green-400)",
                    }}
                  />
                </div>
              )}

              <p className="text-[12px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                {isCompleted
                  ? `${attendances.filter((a) => a.attended === true).length} участвовали · ${formatMoney(pricePerPlayer)} с человека`
                  : `${yesCount} собираются прийти · ${formatMoney(pricePerPlayer)} с человека`}
              </p>

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
                      <span style={{ color: "var(--danger)" }}>
                        {formatMoney(pricePerPlayer)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
