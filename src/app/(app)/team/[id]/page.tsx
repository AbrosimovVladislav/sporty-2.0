"use client";

import { useTeam } from "./team-context";

export default function TeamHomePage() {
  const team = useTeam();

  if (team.status === "loading") {
    return <SkeletonBlock />;
  }

  if (team.status === "not_found" || team.status === "error") {
    // Заголовок в layout уже отрисован — тут ничего не дорисовываем.
    return null;
  }

  const { members, role } = team;
  const playersCount = members.filter((m) => m.role === "player").length;
  const organizersCount = members.filter((m) => m.role === "organizer").length;

  return (
    <>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Состав</p>
        <p className="text-2xl font-display font-bold mt-1">
          {players(playersCount)}
        </p>
        {organizersCount > 0 && (
          <p className="text-sm text-foreground-secondary mt-1">
            + {organizers(organizersCount)}
          </p>
        )}
      </section>

      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <p className="text-sm text-foreground-secondary mt-1">Событий пока нет</p>
      </section>

      {role === "organizer" && (
        <>
          <section className="bg-background-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase font-display text-foreground-secondary">
              Финансовый баланс
            </p>
            <p className="text-2xl font-display font-bold mt-1">0 ₽</p>
          </section>

          <section className="bg-background-card border border-border rounded-lg p-5">
            <p className="text-xs uppercase font-display text-foreground-secondary">
              Входящие заявки
            </p>
            <p className="text-sm text-foreground-secondary mt-1">Новых заявок нет</p>
          </section>
        </>
      )}

      {role === "guest" && (
        <button
          disabled
          className="w-full bg-primary/50 text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 cursor-not-allowed"
        >
          Подать заявку (скоро)
        </button>
      )}
    </>
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

function players(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} игрок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игрока`;
  return `${n} игроков`;
}

function organizers(n: number): string {
  return n === 1 ? `${n} организатор` : `${n} организатора`;
}
