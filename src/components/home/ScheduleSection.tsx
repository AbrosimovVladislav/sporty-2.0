"use client";

import Link from "next/link";
import { SchedulePreviewCard } from "./SchedulePreviewCard";

type ScheduleEvent = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  team: { id: string; name: string } | null;
  venue: { id: string; name: string; photo_url: string | null } | null;
  user_vote: "yes" | "no" | null;
};

type Props = {
  events: ScheduleEvent[];
  loading?: boolean;
};

export function ScheduleSection({ events, loading = false }: Props) {
  if (!loading && events.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
        >
          Расписание
        </span>
        {!loading && (
          <Link
            href="/search?tab=events&my=1"
            className="text-[12px] font-medium"
            style={{ color: "var(--green-500)" }}
          >
            Все события →
          </Link>
        )}
      </div>
      {loading
        ? [0, 1, 2].map((i) => (
            <div
              key={i}
              className="mx-4 mb-2 rounded-[16px] h-[76px] animate-pulse"
              style={{ background: "var(--bg-card)" }}
            />
          ))
        : events.map((event) => (
            <SchedulePreviewCard key={event.id} event={event} />
          ))}
    </section>
  );
}
