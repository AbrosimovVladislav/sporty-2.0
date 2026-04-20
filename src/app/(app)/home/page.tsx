"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SearchIcon, ShieldIcon } from "@/components/Icons";

type MyTeam = {
  id: string;
  name: string;
  city: string;
  sport: string;
  role: "organizer" | "player";
};

type NextEvent = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  team: { id: string; name: string } | null;
  venue: { id: string; name: string; address: string } | null;
  yes_count: number;
};

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

export default function HomePage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const name = auth.status === "authenticated" ? auth.user.name : "";

  const [teams, setTeams] = useState<MyTeam[] | null>(null);
  const [nextEvent, setNextEvent] = useState<NextEvent | null | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      setNextEvent(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setTeams(d.teams ?? []); })
      .catch(() => { if (!cancelled) setTeams([]); });

    fetch(`/api/users/${userId}/next-event`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setNextEvent(d.event ?? null); })
      .catch(() => { if (!cancelled) setNextEvent(null); });

    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="flex flex-1 flex-col p-4 gap-5">

      {/* Welcome header */}
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-5">
        <p className="text-foreground-on-dark-muted text-xs uppercase font-display tracking-wide">
          Добро пожаловать
        </p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{name}</h1>
      </div>

      {/* Next event */}
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide">
          Ближайшее событие
        </p>

        {nextEvent === undefined ? (
          <div className="bg-background-card border border-border rounded-lg p-4 text-center text-foreground-secondary text-sm">
            Загружаю…
          </div>
        ) : nextEvent === null ? (
          <div className="bg-background-card border border-border rounded-lg p-4 text-center text-foreground-secondary text-sm">
            Нет предстоящих событий
          </div>
        ) : (
          <Link
            href={`/team/${nextEvent.team_id}/events/${nextEvent.id}`}
            className="block bg-background-dark text-foreground-on-dark rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-display uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded">
                {EVENT_TYPE_LABEL[nextEvent.type] ?? nextEvent.type}
              </span>
              {nextEvent.team && (
                <span className="text-foreground-on-dark-muted text-xs">
                  {nextEvent.team.name}
                </span>
              )}
            </div>
            <p className="text-lg font-display font-semibold">
              {formatEventDate(nextEvent.date)}
            </p>
            {nextEvent.venue && (
              <p className="text-foreground-on-dark-muted text-sm mt-0.5">
                {nextEvent.venue.name}
              </p>
            )}
            <p className="text-foreground-on-dark-muted text-xs mt-2">
              {nextEvent.yes_count} {nextEvent.yes_count === 1 ? "идёт" : "идут"}
            </p>
          </Link>
        )}
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/search"
          className="flex items-center justify-center gap-2 bg-background-card border border-border rounded-lg p-3 text-sm font-medium"
        >
          <SearchIcon />
          Найти игру
        </Link>
        <Link
          href="/teams"
          className="flex items-center justify-center gap-2 bg-background-card border border-border rounded-lg p-3 text-sm font-medium"
        >
          <ShieldIcon />
          Команды
        </Link>
      </div>

      {/* My teams */}
      {teams !== null && teams.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide">
            Мои команды
          </p>
          <ul className="flex flex-col gap-2">
            {teams.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/team/${t.id}`}
                  className="flex items-center justify-between bg-background-card border border-border rounded-lg px-4 py-3"
                >
                  <div>
                    <h2 className="font-display font-semibold text-base leading-tight">{t.name}</h2>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {t.city} · {SPORT_LABEL[t.sport] ?? t.sport}
                    </p>
                  </div>
                  <span className="text-xs uppercase font-display px-2 py-1 rounded bg-primary/10 text-primary">
                    {t.role === "organizer" ? "Организатор" : "Игрок"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {teams !== null && teams.length === 0 && nextEvent === null && (
        <div className="bg-background-card border border-border rounded-lg p-5 text-center text-foreground-secondary text-sm">
          Вступи в команду, чтобы видеть события
        </div>
      )}
    </div>
  );
}
