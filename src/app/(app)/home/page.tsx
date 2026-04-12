"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

type MyTeam = {
  id: string;
  name: string;
  city: string;
  sport: string;
  role: "organizer" | "player";
};

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

export default function HomePage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const name = auth.status === "authenticated" ? auth.user.name : "";

  const [teams, setTeams] = useState<MyTeam[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setTeams(d.teams ?? []);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">
          Добро пожаловать
        </p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{name}</h1>
      </div>

      {teams === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Команды и события появятся здесь
        </div>
      ) : (
        <>
          <p className="text-xs uppercase font-display text-foreground-secondary">Мои команды</p>
          <ul className="flex flex-col gap-3">
            {teams.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/team/${t.id}`}
                  className="block bg-background-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-lg">{t.name}</h2>
                    <span className="text-xs uppercase font-display px-2 py-1 rounded bg-primary/10 text-primary">
                      {t.role === "organizer" ? "Организатор" : "Игрок"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary mt-1">
                    {t.city} · {SPORT_LABEL[t.sport] ?? t.sport}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
