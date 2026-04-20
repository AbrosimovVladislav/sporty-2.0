"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = {
  id: string;
  name: string;
  city: string | null;
  sport: string | null;
  position: string | null;
  skill_level: string | null;
  preferred_time: string | null;
  bio: string | null;
  birth_date: string | null;
  looking_for_team: boolean;
};

type Stats = {
  playedCount: number;
  votedYesCount: number;
  attendedCount: number;
  reliability: number | null;
  recentEvents: { event_id: string; type: string; date: string; vote: string | null; attended: boolean | null }[];
};

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

function calcAge(birthDate: string): number | null {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/players/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/users/${id}/stats`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([pd, sd]) => {
      setPlayer(pd?.player ?? null);
      setStats(sd ?? null);
    });
  }, [id]);

  if (player === undefined) {
    return (
      <div className="flex flex-1 flex-col p-4 gap-4">
        <div className="bg-background-dark rounded-lg p-5 animate-pulse">
          <div className="h-4 w-20 rounded bg-border-dark" />
          <div className="h-8 w-40 rounded bg-border-dark mt-2" />
        </div>
      </div>
    );
  }

  if (player === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-foreground-secondary text-sm">Игрок не найден</p>
      </div>
    );
  }

  const age = player.birth_date ? calcAge(player.birth_date) : null;

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-5">
        <p className="text-foreground-on-dark-muted text-xs uppercase font-display tracking-wide">
          Профиль
        </p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{player.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {player.city && (
            <span className="text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
              {player.city}
            </span>
          )}
          {player.sport && (
            <span className="text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
              {player.sport}
            </span>
          )}
          {player.looking_for_team && (
            <span className="text-xs text-primary bg-primary/20 rounded-full px-3 py-1 font-medium">
              Ищет команду
            </span>
          )}
        </div>
      </div>

      <section className="bg-background-card border border-border rounded-lg p-5 flex flex-col gap-2">
        <p className="text-xs uppercase font-display text-foreground-secondary">О себе</p>
        {player.bio && <p className="text-sm mt-1">{player.bio}</p>}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
          {player.position && (
            <div>
              <p className="text-xs text-foreground-secondary">Позиция</p>
              <p className="text-sm font-medium">{player.position}</p>
            </div>
          )}
          {player.skill_level && (
            <div>
              <p className="text-xs text-foreground-secondary">Уровень</p>
              <p className="text-sm font-medium">{player.skill_level}</p>
            </div>
          )}
          {age !== null && (
            <div>
              <p className="text-xs text-foreground-secondary">Возраст</p>
              <p className="text-sm font-medium">{age} лет</p>
            </div>
          )}
          {player.preferred_time && (
            <div>
              <p className="text-xs text-foreground-secondary">Время</p>
              <p className="text-sm font-medium">{player.preferred_time}</p>
            </div>
          )}
        </div>
        {!player.bio && !player.position && !player.skill_level && !age && !player.preferred_time && (
          <p className="text-sm text-foreground-secondary mt-1">Информация не заполнена</p>
        )}
      </section>

      {stats && (
        <>
          <section className="bg-background-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase font-display text-foreground-secondary">Статистика</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-2xl font-display font-bold">{stats.playedCount}</p>
                <p className="text-xs text-foreground-secondary">сыграно</p>
              </div>
              {stats.reliability !== null && (
                <div>
                  <p className="text-2xl font-display font-bold">{stats.reliability}%</p>
                  <p className="text-xs text-foreground-secondary">надёжность</p>
                </div>
              )}
            </div>
            {stats.votedYesCount > 0 && (
              <p className="text-xs text-foreground-secondary mt-2">
                Посетил {stats.attendedCount} из {stats.votedYesCount} записанных событий
              </p>
            )}
          </section>

          {stats.recentEvents.length > 0 && (
            <section className="bg-background-card border border-border rounded-lg p-5">
              <p className="text-xs uppercase font-display text-foreground-secondary mb-3">
                Последние события
              </p>
              <ul className="flex flex-col gap-2">
                {stats.recentEvents.map((e) => (
                  <li key={e.event_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {TYPE_LABEL[e.type] ?? e.type}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        {new Date(e.date).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium rounded-full px-2.5 py-1 ${
                        e.attended
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {e.attended ? "Был" : "Не пришёл"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
