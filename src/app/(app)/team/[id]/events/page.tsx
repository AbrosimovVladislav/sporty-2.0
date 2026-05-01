"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { FilterPills } from "@/components/ui/FilterPills";
import { TYPE_PILLS } from "./_components/constants";
import { EventCreateSheet } from "./_components/EventCreateSheet";
import { EventsListSkeleton } from "./_components/EventsListSkeleton";
import { EventsSection } from "./_components/EventsSection";
import { PlusIcon } from "./_components/icons";
import type { EventItem } from "./_components/types";

export default function EventsPage() {
  const team = useTeam();
  const auth = useAuth();

  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const teamName = team.status === "ready" ? team.team.name : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";

  const loadEvents = () => {
    if (!teamId) return;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/events${params}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]));
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, userId]);

  if (team.status === "loading" || events === null) {
    return <EventsListSkeleton />;
  }

  if (team.status !== "ready") return null;

  const filtered = typeFilter
    ? events.filter((e) => e.type === typeFilter)
    : events;

  const planned = filtered
    .filter((e) => e.status === "planned")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = filtered
    .filter((e) => e.status !== "planned")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className="mb-4">
        <FilterPills
          options={TYPE_PILLS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-10">
          <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>
            {typeFilter ? "Нет событий этого типа" : "Событий пока нет"}
          </p>
        </div>
      ) : (
        <>
          <EventsSection
            title="ПРЕДСТОЯЩИЕ"
            events={planned}
            teamId={teamId!}
            teamName={teamName}
          />
          <EventsSection
            title="ПРОШЕДШИЕ"
            events={past}
            teamId={teamId!}
            teamName={teamName}
            muted
          />
        </>
      )}

      {isOrganizer && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Создать событие"
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 transition-transform active:scale-95"
          style={{
            background: "var(--green-500)",
            color: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <PlusIcon />
        </button>
      )}

      {showCreate && teamId && userId && team.status === "ready" && (
        <EventCreateSheet
          teamId={teamId}
          userId={userId}
          teamCity={team.team.city}
          onCreated={() => {
            setShowCreate(false);
            loadEvents();
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
