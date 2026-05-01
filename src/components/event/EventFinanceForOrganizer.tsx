"use client";

import { useEffect, useState } from "react";
import { formatMoney, pluralize } from "@/lib/format";

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
  const debtAmount = debtors.length * pricePerPlayer;

  const venueRemaining = Math.max(0, venueCost - venuePaid);
  const venueFullyPaid = venueCost > 0 && venueRemaining === 0;
  const venuePct = venueCost > 0 ? Math.min(100, (venuePaid / venueCost) * 100) : 0;
  const collectedPct = expected > 0 ? Math.min(100, (collected / expected) * 100) : 0;
  const allPaid = isCompleted && expected > 0 && collected >= expected;

  async function saveCost() {
    setSaving(true);
    try {
      await onPatch({ venue_cost: parseFloat(costInput) || 0 });
      setEditingCost(false);
    } finally {
      setSaving(false);
    }
  }

  async function payVenueInFull() {
    setSaving(true);
    try {
      await onPatch({ venue_paid: venueCost });
    } finally {
      setSaving(false);
    }
  }

  async function unpayVenue() {
    setSaving(true);
    try {
      await onPatch({ venue_paid: 0 });
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

      <div className="flex flex-col gap-2.5">
        {/* Площадка */}
        <Card>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
            >
              Площадка
            </p>
            <button
              type="button"
              onClick={() => setEditingCost((v) => !v)}
              className="text-[12px] font-semibold"
              style={{ color: "var(--green-600)" }}
            >
              {editingCost ? "Отмена" : venueCost === 0 ? "Указать" : "Изменить"}
            </button>
          </div>

          {editingCost ? (
            <div className="flex gap-2 items-center mb-2">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                autoFocus
                placeholder="0"
                className="font-display text-[28px] font-bold leading-none flex-1 outline-none"
                style={{
                  color: "var(--text-primary)",
                  background: "transparent",
                  borderBottom: "1.5px solid var(--green-500)",
                  padding: "4px 0",
                }}
              />
              <span
                className="font-display text-[24px] font-bold"
                style={{ color: "var(--text-secondary)" }}
              >
                ₸
              </span>
              <button
                type="button"
                onClick={saveCost}
                disabled={saving}
                className="text-[13px] font-bold rounded-full px-4 py-2 disabled:opacity-50"
                style={{ background: "var(--green-500)", color: "white" }}
              >
                Ок
              </button>
            </div>
          ) : venueCost === 0 ? (
            <p
              className="text-[14px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Стоимость не указана
            </p>
          ) : (
            <>
              <p
                className="font-display text-[28px] font-bold leading-none mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {formatMoney(venuePaid)}
                <span
                  className="font-display text-[18px] font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {" "}/ {formatMoney(venueCost)}
                </span>
              </p>
              <ProgressBar pct={venuePct} done={venueFullyPaid} />
              {venueFullyPaid ? (
                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: "1px solid var(--gray-100)" }}
                >
                  <span
                    className="text-[13px] font-semibold flex items-center gap-1.5"
                    style={{ color: "var(--green-700)" }}
                  >
                    <CheckIcon />
                    Полностью оплачено
                  </span>
                  <button
                    type="button"
                    onClick={unpayVenue}
                    disabled={saving}
                    className="text-[12px] font-medium disabled:opacity-50"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Отменить
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={payVenueInFull}
                  disabled={saving}
                  className="w-full mt-3 py-3 rounded-xl text-[14px] font-bold transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "var(--green-500)", color: "white" }}
                >
                  Отметить оплату · {formatMoney(venueRemaining)}
                </button>
              )}
            </>
          )}
        </Card>

        {/* Сборы */}
        {pricePerPlayer > 0 && (
          <Card>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p
                className="text-[11px] font-semibold uppercase"
                style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
              >
                Сборы с игроков
              </p>
              <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                {formatMoney(pricePerPlayer)} с человека
              </span>
            </div>

            {isCompleted ? (
              <>
                <p
                  className="font-display text-[28px] font-bold leading-none mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatMoney(collected)}
                  <span
                    className="font-display text-[18px] font-medium"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {" "}/ {formatMoney(expected)}
                  </span>
                </p>
                {expected > 0 && <ProgressBar pct={collectedPct} done={allPaid} />}

                {allPaid ? (
                  <div
                    className="flex items-center gap-1.5 mt-3 pt-3 text-[13px] font-semibold"
                    style={{
                      borderTop: "1px solid var(--gray-100)",
                      color: "var(--green-700)",
                    }}
                  >
                    <CheckIcon />
                    Все сдали
                  </div>
                ) : debtors.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDebtors((v) => !v)}
                      className="w-full mt-3 py-3 rounded-xl text-[14px] font-bold transition-transform active:scale-[0.98] flex items-center justify-between px-4"
                      style={{
                        background: "oklch(0.95 0.06 25)",
                        color: "var(--danger)",
                      }}
                    >
                      <span>
                        Должны {debtors.length} {pluralize(debtors.length, ["человек", "человека", "человек"])} · {formatMoney(debtAmount)}
                      </span>
                      <span style={{ transform: showDebtors ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <ChevronDownIcon />
                      </span>
                    </button>
                    {showDebtors && (
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
                            <span className="font-semibold" style={{ color: "var(--danger)" }}>
                              {formatMoney(pricePerPlayer)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}
              </>
            ) : (
              // Planned mode — expected revenue only
              <>
                <p
                  className="font-display text-[28px] font-bold leading-none mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatMoney(expected)}
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  Ожидается с {yesCount} {pluralize(yesCount, ["игрока", "игроков", "игроков"])}
                </p>
              </>
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
      className="rounded-2xl px-4 py-4"
      style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ pct, done }: { pct: number; done: boolean }) {
  return (
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ background: "var(--gray-100)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: done ? "var(--green-500)" : "var(--green-400)",
        }}
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
