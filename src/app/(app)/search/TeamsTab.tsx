"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SearchTeam = {
  id: string;
  name: string;
  sport: string;
  city: string;
  description: string | null;
  looking_for_players: boolean;
  members_count: number;
};

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

function membersLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} игрок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игрока`;
  return `${n} игроков`;
}

export default function TeamsTab() {
  const [city, setCity] = useState("");
  const [teams, setTeams] = useState<SearchTeam[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("looking_for_players", "true");
      if (city.trim()) params.set("city", city.trim());
      fetch(`/api/teams?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setTeams(d.teams ?? []);
        })
        .catch(() => {
          if (!cancelled) setTeams([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Город</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Любой город"
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>

      {teams === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Команд, ищущих игроков, не найдено
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/team/${t.id}`}
                className="block bg-background-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-lg">{t.name}</h2>
                  <span className="text-xs font-display uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                    Набор открыт
                  </span>
                </div>
                <p className="text-sm text-foreground-secondary mt-1">
                  {t.city} · {SPORT_LABEL[t.sport] ?? t.sport}
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  {membersLabel(t.members_count)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
