"use client";

import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { FilterPills } from "@/components/ui/FilterPills";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { TYPE_PILLS } from "./_components/constants";
import { EventCreateSheet } from "./_components/EventCreateSheet";
import { EventsListSkeleton } from "./_components/EventsListSkeleton";
import { EventsSection } from "./_components/EventsSection";
import { PlusIcon } from "./_components/icons";
import type { EventItem } from "./_components/types";

type EventsPage = { events: EventItem[]; nextCursor: string | null };

async function fetchEventsPage(
  teamId: string,
  userId: string | null,
  direction: "upcoming" | "past",
  cursor: string | null,
): Promise<EventsPage> {
  const params = new URLSearchParams({ direction, limit: "20" });
  if (userId) params.set("userId", userId);
  if (cursor) params.set("cursor", cursor);
  const r = await fetch(`/api/teams/${teamId}/events?${params}`);
  if (!r.ok) throw new Error("events fetch failed");
  return r.json();
}

export default function EventsPage() {
  const team = useTeam();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const teamName = team.status === "ready" ? team.team.name : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";

  const upcoming = useInfiniteQuery({
    queryKey: ["team-events", teamId, userId, "upcoming"],
    queryFn: ({ pageParam }) =>
      fetchEventsPage(teamId!, userId, "upcoming", pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!teamId,
  });

  const past = useInfiniteQuery({
    queryKey: ["team-events", teamId, userId, "past"],
    queryFn: ({ pageParam }) =>
      fetchEventsPage(teamId!, userId, "past", pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!teamId,
  });

  if (team.status === "loading" || upcoming.isPending || past.isPending) {
    return <EventsListSkeleton />;
  }

  if (team.status !== "ready") return null;

  const upcomingItems = upcoming.data?.pages.flatMap((p) => p.events) ?? [];
  const pastItems = past.data?.pages.flatMap((p) => p.events) ?? [];

  const filterFn = (e: EventItem) => !typeFilter || e.type === typeFilter;
  const plannedFiltered = upcomingItems.filter(filterFn);
  const pastFiltered = pastItems.filter(filterFn);
  const isEmpty = plannedFiltered.length === 0 && pastFiltered.length === 0;

  return (
    <>
      <div className="mb-4">
        <FilterPills
          options={TYPE_PILLS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center pt-10">
          <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>
            {typeFilter ? "Нет событий этого типа" : "Событий пока нет"}
          </p>
        </div>
      ) : (
        <>
          {plannedFiltered.length > 0 && (
            <EventsSection
              title="ПРЕДСТОЯЩИЕ"
              events={plannedFiltered}
              teamId={teamId!}
              teamName={teamName}
            />
          )}
          {upcoming.hasNextPage && (
            <InfiniteScrollSentinel
              onVisible={() => {
                if (!upcoming.isFetchingNextPage) upcoming.fetchNextPage();
              }}
            />
          )}
          {pastFiltered.length > 0 && (
            <EventsSection
              title="ПРОШЕДШИЕ"
              events={pastFiltered}
              teamId={teamId!}
              teamName={teamName}
              muted
            />
          )}
          {past.hasNextPage && (
            <InfiniteScrollSentinel
              onVisible={() => {
                if (!past.isFetchingNextPage) past.fetchNextPage();
              }}
            />
          )}
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
            queryClient.invalidateQueries({ queryKey: ["team-events", teamId] });
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
