"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { PlayerCard } from "@/components/PlayerCard";

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

type FinancesData = {
  metrics: {
    collected: number;
    expected: number;
    venueCostTotal: number;
    venuePaidTotal: number;
    venueOutstanding: number;
    playersDebt: number;
    playersOverpaid: number;
    cash: number;
    realBalance: number;
  };
  debtors: { userId: string; name: string; amount: number }[];
  creditors: { userId: string; name: string; amount: number }[];
  venueEvents: {
    eventId: string;
    type: string;
    date: string;
    venueName: string | null;
    cost: number;
    paid: number;
  }[];
};

export default function TeamFinancesPage() {
  const team = useTeam();
  const auth = useAuth();
  const [data, setData] = useState<FinancesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;

  useEffect(() => {
    if (!teamId || !userId) return;
    let cancelled = false;
    fetch(`/api/teams/${teamId}/finances?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setError("Доступ запрещён");
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
  }, [teamId, userId]);

  if (team.status === "loading" || data === null) {
    if (error) {
      return (
        <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          {error}
        </section>
      );
    }
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Загружаю…
      </section>
    );
  }

  if (team.status !== "ready" || team.role !== "organizer") {
    return null;
  }

  const m = data.metrics;

  return (
    <>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Реальный баланс</p>
        <p
          className={`text-3xl font-display font-bold mt-1 ${
            m.realBalance >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {m.realBalance >= 0 ? "+" : ""}
          {m.realBalance} ₽
        </p>
        <p className="text-xs text-foreground-secondary mt-1">
          Что останется команде, когда все долги закрыты и площадки оплачены
        </p>
      </section>

      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Показатели</p>
        <Row label="Касса (на руках)" value={`${m.cash} ₽`} />
        <Row label="Собрано от игроков" value={`${m.collected} ₽`} />
        <Row label="Ожидаемый сбор" value={`${m.expected} ₽`} muted />
        <Row label="Расходы площадкам" value={`${m.venueCostTotal} ₽`} />
        <Row label="Оплачено площадкам" value={`${m.venuePaidTotal} ₽`} muted />
        <Row label="Остаток к оплате" value={`${m.venueOutstanding} ₽`} />
        <Row label="Долги игроков" value={`${m.playersDebt} ₽`} />
        <Row label="Переплаты игроков" value={`${m.playersOverpaid} ₽`} />
      </section>

      {(data.debtors.length > 0 || data.creditors.length > 0) && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary mb-3">
            Задолженности игроков
          </p>
          <ul className="flex flex-col gap-2">
            {data.debtors.map((d) => (
              <li key={`debt-${d.userId}`}>
                <button
                  onClick={() => setOpenPlayerId(d.userId)}
                  className="w-full flex items-center justify-between py-2 border-b border-border last:border-b-0 text-left"
                >
                  <span className="text-sm">{d.name}</span>
                  <span className="text-sm font-medium text-red-500">−{d.amount} ₽</span>
                </button>
              </li>
            ))}
            {data.creditors.map((c) => (
              <li key={`cred-${c.userId}`}>
                <button
                  onClick={() => setOpenPlayerId(c.userId)}
                  className="w-full flex items-center justify-between py-2 border-b border-border last:border-b-0 text-left"
                >
                  <span className="text-sm">{c.name}</span>
                  <span className="text-sm font-medium text-green-600">+{c.amount} ₽</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-foreground-secondary mt-2">
            «−» — игрок должен команде, «+» — переплатил
          </p>
        </section>
      )}

      {data.venueEvents.length > 0 && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Площадки</p>
          <ul className="flex flex-col gap-2">
            {data.venueEvents.map((v) => {
              const date = new Date(v.date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              });
              const remain = v.cost - v.paid;
              return (
                <li key={v.eventId}>
                  <Link
                    href={`/team/${teamId}/events/${v.eventId}`}
                    className="block py-2 border-b border-border last:border-b-0"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium">
                        {TYPE_LABEL[v.type] ?? v.type} · {date}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          remain > 0 ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {remain > 0 ? `−${remain} ₽` : "оплачено"}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {v.venueName ? `${v.venueName} · ` : ""}
                      {v.paid} из {v.cost} ₽
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {teamId && userId && openPlayerId && (
        <PlayerCard
          teamId={teamId}
          requesterId={userId}
          targetUserId={openPlayerId}
          onClose={() => setOpenPlayerId(null)}
        />
      )}
    </>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-foreground-secondary" : ""}`}>
      <span className="text-foreground-secondary">{label}</span>
      <span className={muted ? "" : "font-medium"}>{value}</span>
    </div>
  );
}
