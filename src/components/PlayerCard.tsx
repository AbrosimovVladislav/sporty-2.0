"use client";

import { useEffect, useState } from "react";
import { Card, Avatar, Pill, Button, SectionEyebrow } from "@/components/ui";

type FinancesData = {
  user: { id: string; name: string; city: string | null };
  totals: { expected: number; paid: number; balance: number };
  history: {
    id: string;
    amount: number;
    type: string;
    label: string;
    note: string | null;
    created_at: string;
  }[];
};

type OrgAction = {
  label: string;
  variant: "primary" | "secondary" | "danger";
  onClick: () => void;
  loading?: boolean;
};

export function PlayerCard({
  teamId,
  requesterId,
  targetUserId,
  onClose,
  organizerActions,
}: {
  teamId: string;
  requesterId: string;
  targetUserId: string;
  onClose: () => void;
  organizerActions?: OrgAction[];
}) {
  const [data, setData] = useState<FinancesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/teams/${teamId}/members/${targetUserId}/finances?userId=${requesterId}`)
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setError("Не удалось загрузить");
          return null;
        }
        return r.json();
      })
      .then((d) => { if (!cancelled && d) setData(d); })
      .catch(() => { if (!cancelled) setError("Не удалось загрузить"); });
    return () => { cancelled = true; };
  }, [teamId, requesterId, targetUserId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background-overlay" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background-card rounded-t-xl p-6 max-h-[85vh] overflow-y-auto shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <Avatar size="md" name={data?.user.name} />
            <div>
              <h2 className="text-[17px] font-semibold leading-tight">{data?.user.name ?? "…"}</h2>
              {data?.user.city && (
                <p className="text-[13px] text-foreground-secondary mt-0.5">{data.user.city}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary text-2xl leading-none px-2 -mr-2"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {error && <p className="text-[14px] text-danger mb-4">{error}</p>}

        {data && (
          <>
            {/* Balance card */}
            <Card className="mb-5">
              <SectionEyebrow tone="muted">Сальдо</SectionEyebrow>
              <p className={`text-[28px] font-semibold tabular-nums leading-none mt-1 ${data.totals.balance >= 0 ? "text-primary" : "text-danger"}`}>
                {data.totals.balance >= 0 ? "+" : ""}{data.totals.balance} ₸
              </p>
              <p className="text-[13px] text-foreground-secondary mt-1">
                {data.totals.balance > 0
                  ? "Команда должна игроку"
                  : data.totals.balance < 0
                  ? "Игрок должен команде"
                  : "В расчёте"}
              </p>
              <div className="flex justify-between text-[13px] text-foreground-secondary mt-3 pt-3 border-t border-border">
                <span>Должен сдать: {data.totals.expected} ₸</span>
                <span>Сдал: {data.totals.paid} ₸</span>
              </div>
            </Card>

            {/* Payment history */}
            <SectionEyebrow tone="muted">История платежей</SectionEyebrow>
            {data.history.length === 0 ? (
              <p className="text-[14px] text-foreground-secondary">Платежей нет</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-[15px] font-medium">{h.label}</p>
                      <p className="text-[13px] text-foreground-secondary">
                        {new Date(h.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        {h.type === "deposit" && (
                          <Pill variant="role" className="ml-2">депозит</Pill>
                        )}
                      </p>
                    </div>
                    <span className="text-[15px] font-semibold tabular-nums text-primary">+{h.amount} ₸</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Organizer actions */}
        {organizerActions && organizerActions.length > 0 && (
          <div className="flex flex-col gap-2 mt-6 pt-5 border-t border-border">
            {organizerActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant}
                size="md"
                loading={action.loading}
                onClick={action.onClick}
                className="w-full"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
