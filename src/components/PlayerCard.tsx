"use client";

import { useEffect, useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

type FinancesData = {
  user: { id: string; name: string; city: string | null };
  totals: { expected: number; paid: number; balance: number };
  history: {
    eventId: string;
    type: string;
    date: string;
    attended: boolean;
    paid: boolean;
    expected: number;
    paidAmount: number;
  }[];
};

export function PlayerCard({
  teamId,
  requesterId,
  targetUserId,
  onClose,
}: {
  teamId: string;
  requesterId: string;
  targetUserId: string;
  onClose: () => void;
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
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить");
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, requesterId, targetUserId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-background border-t border-border rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs uppercase font-display text-foreground-secondary">Игрок</p>
            <h2 className="text-2xl font-display font-bold mt-1">
              {data?.user.name ?? "…"}
            </h2>
            {data?.user.city && (
              <p className="text-sm text-foreground-secondary mt-1">{data.user.city}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary text-2xl leading-none px-2"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {data && (
          <>
            <div className="bg-background-card border border-border rounded-lg p-4 mb-4">
              <p className="text-xs uppercase font-display text-foreground-secondary">Сальдо</p>
              <p
                className={`text-2xl font-display font-bold mt-1 ${
                  data.totals.balance >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {data.totals.balance >= 0 ? "+" : ""}
                {data.totals.balance} ₽
              </p>
              <p className="text-xs text-foreground-secondary mt-1">
                {data.totals.balance > 0
                  ? "Команда должна игроку"
                  : data.totals.balance < 0
                  ? "Игрок должен команде"
                  : "В расчёте"}
              </p>
              <div className="flex justify-between text-xs text-foreground-secondary mt-2 pt-2 border-t border-border">
                <span>Должен сдать: {data.totals.expected} ₽</span>
                <span>Сдал: {data.totals.paid} ₽</span>
              </div>
            </div>

            <p className="text-xs uppercase font-display text-foreground-secondary mb-2">
              История событий
            </p>
            {data.history.length === 0 ? (
              <p className="text-sm text-foreground-secondary">Завершённых событий нет</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.history.map((h) => {
                  const date = new Date(h.date).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const status = h.attended
                    ? h.paid
                      ? `Был, сдал ${h.paidAmount} ₽`
                      : `Был, должен ${h.expected} ₽`
                    : "Не был";
                  const tone = h.attended
                    ? h.paid
                      ? "text-green-600"
                      : "text-red-500"
                    : "text-foreground-secondary";
                  return (
                    <li
                      key={h.eventId}
                      className="flex items-center justify-between border-b border-border pb-2 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {TYPE_LABEL[h.type] ?? h.type}
                        </p>
                        <p className="text-xs text-foreground-secondary">{date}</p>
                      </div>
                      <span className={`text-xs ${tone}`}>{status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
