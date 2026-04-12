"use client";

import { useTeam, type TeamMember } from "../team-context";

export default function RosterPage() {
  const team = useTeam();

  if (team.status === "loading") {
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Загружаю состав…
      </section>
    );
  }

  if (team.status !== "ready") {
    return null;
  }

  const organizers = team.members.filter((m) => m.role === "organizer");
  const players = team.members.filter((m) => m.role === "player");

  if (team.members.length === 0) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        В команде пока никого нет
      </section>
    );
  }

  return (
    <>
      {organizers.length > 0 && (
        <RosterGroup title="Организаторы" items={organizers} />
      )}
      {players.length > 0 && <RosterGroup title="Игроки" items={players} />}
    </>
  );
}

function RosterGroup({ title, items }: { title: string; items: TeamMember[] }) {
  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((m) => (
          <li
            key={m.id}
            className="bg-background-card border border-border rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <span className="font-medium">{m.user.name}</span>
            {m.user.city && (
              <span className="text-xs text-foreground-secondary">{m.user.city}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
