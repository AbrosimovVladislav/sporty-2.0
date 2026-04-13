"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "На рассмотрении",
  accepted: "Принята",
  rejected: "Отклонена",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-primary/10 text-primary",
  accepted: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-500",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

type JoinRequestItem = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  team: { id: string; name: string; city: string; sport: string };
};

type UserEventItem = {
  attendanceId: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  event: {
    id: string;
    team_id: string;
    type: string;
    date: string;
    status: string;
    price_per_player: number;
    team: { id: string; name: string } | null;
  };
};

type UserEventStats = {
  total: number;
  attended: number;
  paid: number;
};

export default function ProfilePage() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (auth.status !== "authenticated") {
    return null;
  }

  const { user } = auth;

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Профиль</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{user.name}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {user.city && (
          <div className="bg-background-card border border-border rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-foreground-secondary text-sm">Город</span>
            <span className="text-foreground font-medium">{user.city}</span>
          </div>
        )}
        {user.sport && (
          <div className="bg-background-card border border-border rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-foreground-secondary text-sm">Вид спорта</span>
            <span className="text-foreground font-medium">{user.sport}</span>
          </div>
        )}
      </div>

      <MyEventHistory userId={user.id} />

      <MyJoinRequests userId={user.id} />
    </div>
  );
}

function MyEventHistory({ userId }: { userId: string }) {
  const [events, setEvents] = useState<UserEventItem[] | null>(null);
  const [stats, setStats] = useState<UserEventStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/events`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setEvents(d.events ?? []);
          setStats(d.stats ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">События</p>

      {stats && stats.total > 0 && (
        <div className="bg-background-card border border-border rounded-lg px-4 py-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-secondary">Завершённых событий</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-foreground-secondary">Посещено</span>
            <span className="font-medium">{stats.attended} из {stats.total}</span>
          </div>
        </div>
      )}

      {events === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : events.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Событий пока нет
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.slice(0, 10).map((item) => (
            <li key={item.attendanceId}>
              <Link
                href={`/team/${item.event.team_id}/events/${item.event.id}`}
                className="block bg-background-card border border-border rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {EVENT_TYPE_LABEL[item.event.type] ?? item.event.type}
                    </p>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {item.event.team?.name ?? "Команда"} · {formatEventDate(item.event.date)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {item.vote === "yes" && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600">приду</span>
                    )}
                    {item.vote === "no" && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500">не приду</span>
                    )}
                    {item.attended === true && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600">был</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function MyJoinRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<JoinRequestItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/join-requests`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRequests(d.requests ?? []);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">Мои заявки</p>

      {requests === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Заявок пока нет
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/team/${r.team.id}`}
                className="block bg-background-card border border-border rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.team.name}</p>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {r.team.city} · {SPORT_LABEL[r.team.sport] ?? r.team.sport}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-display font-semibold uppercase px-2 py-1 rounded ${STATUS_STYLE[r.status] ?? ""}`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
