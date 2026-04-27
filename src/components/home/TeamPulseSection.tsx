"use client";

import { TeamPulseCard } from "./TeamPulseCard";

type Team = {
  id: string;
  name: string;
  sport: string;
  city: string;
  role: "organizer" | "player";
  next_event: {
    id: string;
    type: string;
    date: string;
    yes_count: number;
    min_players: number;
  } | null;
  pending_requests: number;
  debtors: number;
};

type Props = {
  teams: Team[];
};

export function TeamPulseSection({ teams }: Props) {
  if (teams.length === 0) return null;

  return (
    <section>
      <div className="px-4 pt-6 pb-3">
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
        >
          Мои команды
        </span>
      </div>
      <div
        className="flex gap-2.5 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {teams.map((team) => (
          <TeamPulseCard key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}
