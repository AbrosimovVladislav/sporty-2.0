"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "./team-context";

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

export default function TeamHomePage() {
  const team = useTeam();

  if (team.status === "loading") {
    return <SkeletonBlock />;
  }

  if (team.status === "not_found" || team.status === "error") {
    return null;
  }

  const { members, role, pendingRequestsCount, teamStats } = team;
  const playersCount = members.filter((m) => m.role === "player").length;
  const organizersCount = members.filter((m) => m.role === "organizer").length;

  return (
    <>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Состав</p>
        <p className="text-2xl font-display font-bold mt-1">
          {playersLabel(playersCount)}
        </p>
        {organizersCount > 0 && (
          <p className="text-sm text-foreground-secondary mt-1">
            + {organizersLabel(organizersCount)}
          </p>
        )}
      </section>

      <NextEventBlock teamId={team.team.id} />

      {(teamStats.completedEvents > 0 || teamStats.plannedEvents > 0) && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary">Статистика</p>
          <div className="flex gap-6 mt-2">
            <div>
              <p className="text-2xl font-display font-bold">{teamStats.completedEvents}</p>
              <p className="text-xs text-foreground-secondary">проведено</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{teamStats.plannedEvents}</p>
              <p className="text-xs text-foreground-secondary">запланировано</p>
            </div>
          </div>
        </section>
      )}

      {role === "organizer" && (
        <>
          <section className="bg-background-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase font-display text-foreground-secondary">
              Финансовый баланс
            </p>
            <p className="text-2xl font-display font-bold mt-1">0 ₽</p>
          </section>

          <IncomingRequestsBlock
            teamId={team.team.id}
            count={pendingRequestsCount}
            onChanged={team.reload}
          />
        </>
      )}

      {role === "guest" && <JoinRequestButton teamId={team.team.id} />}
    </>
  );
}

function JoinRequestButton({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [sending, setSending] = useState(false);

  if (team.status !== "ready") return null;

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { joinRequestStatus, reload } = team;

  if (joinRequestStatus === "pending") {
    return (
      <div className="w-full bg-background-card border border-border text-foreground-secondary font-display font-semibold uppercase rounded-full px-6 py-3 text-center">
        Заявка отправлена
      </div>
    );
  }

  if (joinRequestStatus === "rejected") {
    return (
      <div className="w-full bg-background-card border border-border text-foreground-secondary font-display font-semibold uppercase rounded-full px-6 py-3 text-center">
        Заявка отклонена
      </div>
    );
  }

  async function handleJoin() {
    if (!userId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) reload();
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      onClick={handleJoin}
      disabled={sending || !userId}
      className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {sending ? "Отправляю…" : "Подать заявку"}
    </button>
  );
}

type RequestItem = {
  id: string;
  user_id: string;
  created_at: string;
  user: { id: string; name: string; city: string | null };
};

function IncomingRequestsBlock({
  teamId,
  count,
  onChanged,
}: {
  teamId: string;
  count: number;
  onChanged: () => void;
}) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const [requests, setRequests] = useState<RequestItem[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  async function loadRequests() {
    if (!userId) return;
    setExpanded(true);
    const res = await fetch(`/api/teams/${teamId}/join-requests?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests ?? []);
    }
  }

  async function handleAction(requestId: string, action: "accept" | "reject") {
    if (!userId) return;
    setProcessing(requestId);
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      setRequests((prev) => (prev ? prev.filter((r) => r.id !== requestId) : null));
      onChanged();
    } finally {
      setProcessing(null);
    }
  }

  if (!expanded) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">
          Входящие заявки
        </p>
        {count === 0 ? (
          <p className="text-sm text-foreground-secondary mt-1">Новых заявок нет</p>
        ) : (
          <button
            onClick={loadRequests}
            className="text-primary font-display font-semibold text-sm mt-1 underline underline-offset-4"
          >
            {requestsLabel(count)} — посмотреть
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-display text-foreground-secondary mb-3">
        Входящие заявки
      </p>
      {requests === null ? (
        <p className="text-sm text-foreground-secondary">Загружаю…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-foreground-secondary">Новых заявок нет</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="border border-border rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.user.name}</p>
                  {r.user.city && (
                    <p className="text-xs text-foreground-secondary">{r.user.city}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, "accept")}
                    disabled={processing === r.id}
                    className="text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={processing === r.id}
                    className="text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full border border-border text-foreground-secondary disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type NextEvent = {
  id: string;
  type: string;
  date: string;
  venue: { name: string } | null;
  yesCount: number;
};

function NextEventBlock({ teamId }: { teamId: string }) {
  const [event, setEvent] = useState<NextEvent | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/teams/${teamId}/events`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const planned = (d.events ?? []).filter((e: { status: string }) => e.status === "planned");
        setEvent(planned.length > 0 ? planned[0] : null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (event === undefined) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <div className="h-6 w-40 rounded bg-border mt-2 animate-pulse" />
      </section>
    );
  }

  if (event === null) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <p className="text-sm text-foreground-secondary mt-1">Событий пока нет</p>
      </section>
    );
  }

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Link href={`/team/${teamId}/events/${event.id}`}>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <p className="text-lg font-display font-bold mt-1">
          {TYPE_LABEL[event.type] ?? event.type} — {dateStr}
        </p>
        {event.venue && (
          <p className="text-sm text-foreground-secondary mt-1">{event.venue.name}</p>
        )}
        <p className="text-sm text-foreground-secondary mt-1">
          Придут: {event.yesCount}
        </p>
      </section>
    </Link>
  );
}

function SkeletonBlock() {
  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <div className="h-4 w-24 rounded bg-border animate-pulse" />
      <div className="h-8 w-32 rounded bg-border mt-2 animate-pulse" />
    </section>
  );
}

function playersLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} игрок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игрока`;
  return `${n} игроков`;
}

function organizersLabel(n: number): string {
  return n === 1 ? `${n} организатор` : `${n} организатора`;
}

function requestsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} заявка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} заявки`;
  return `${n} заявок`;
}
