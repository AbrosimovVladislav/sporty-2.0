"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../../team-context";
import { EventHero } from "@/components/event/EventHero";
import { EventAttendeesPreview } from "@/components/event/EventAttendeesPreview";
import { EventAttendeesSheet } from "@/components/event/EventAttendeesSheet";
import { EventVenueCard } from "@/components/event/EventVenueCard";
import { EventFinanceForPlayer } from "@/components/event/EventFinanceForPlayer";
import { EventFinanceForOrganizer } from "@/components/event/EventFinanceForOrganizer";
import { EventManagement } from "@/components/event/EventManagement";

type EventDetail = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  status: string;
  venue_cost: number;
  venue_paid: number;
  is_public: boolean;
  created_by: string;
  venue: { id: string; name: string; address: string; photo_url: string | null } | null;
};

type AttendanceItem = {
  id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  paid_amount: number | null;
  user: { id: string; name: string };
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id: teamId, eventId } = use(params);
  const auth = useAuth();
  const team = useTeam();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [attSheetOpen, setAttSheetOpen] = useState(false);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";
  const isMember = team.status === "ready" && team.role !== "guest";
  const totalMembers = team.status === "ready" ? team.members.length : 0;
  const teamName = team.status === "ready" ? team.team.name : "Команда";

  const loadEvent = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/events/${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setEvent(data.event);
      setAttendances(data.attendances ?? []);
    }
    setLoading(false);
  }, [teamId, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function patchEvent(body: Record<string, unknown>) {
    if (!userId) return;
    const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    if (res.ok) await loadEvent();
  }

  async function handleAttendedToggle(targetUserId: string, attended: boolean) {
    if (!userId) return;
    await fetch(`/api/teams/${teamId}/events/${eventId}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetUserId, attended }),
    });
    await loadEvent();
  }

  function handleVoted() {
    loadEvent();
  }

  if (loading || !event) {
    return (
      <div className="flex flex-1 flex-col">
        <div
          className="h-[220px] animate-pulse"
          style={{
            background: "var(--gray-100)",
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        />
        <div className="px-4 pt-4">
          <div className="h-6 w-2/3 rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
          <div className="h-4 w-1/2 rounded animate-pulse mt-2" style={{ background: "var(--gray-100)" }} />
        </div>
      </div>
    );
  }

  const yesAttendances = attendances.filter((a) => a.vote === "yes");
  const noAttendances = attendances.filter((a) => a.vote === "no");
  const respondedIds = new Set(attendances.filter((a) => a.vote !== null).map((a) => a.user_id));
  const waitingCount = Math.max(0, totalMembers - respondedIds.size);
  const myAttendance = userId ? attendances.find((a) => a.user_id === userId) : null;
  const myVote = myAttendance?.vote ?? null;
  const myPaid = myAttendance?.paid === true;
  const isCompleted = event.status === "completed";
  const isPlanned = event.status === "planned";
  const canVote = isPlanned && !!userId && (isMember || event.is_public);

  return (
    <div className="flex flex-1 flex-col pb-8">
      <EventHero
        teamId={teamId}
        eventId={eventId}
        userId={userId}
        teamName={teamName}
        type={event.type}
        status={event.status}
        date={event.date}
        photoUrl={event.venue?.photo_url ?? null}
        venueName={event.venue?.name ?? null}
        pricePerPlayer={event.price_per_player}
        minPlayers={event.min_players}
        yesCount={yesAttendances.length}
        noCount={noAttendances.length}
        waitingCount={waitingCount}
        userVote={myVote}
        canVote={canVote}
        onVoted={handleVoted}
        onVenueClick={
          event.venue
            ? () =>
                document
                  .getElementById("venue")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
            : undefined
        }
      />

      {isCompleted && myAttendance && <PastModeStatus attended={myAttendance.attended} />}

      <EventAttendeesPreview
        yes={yesAttendances}
        no={noAttendances}
        waiting={waitingCount}
        onOpen={() => setAttSheetOpen(true)}
      />

      {event.venue && <EventVenueCard venue={event.venue} />}

      {event.description && (
        <section className="px-4 mt-6">
          <p
            className="text-[11px] font-semibold uppercase mb-2 px-1"
            style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
          >
            Описание
          </p>
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-secondary)" }}>
            <p
              className="text-[14px] whitespace-pre-wrap"
              style={{ color: "var(--text-primary)" }}
            >
              {event.description}
            </p>
          </div>
        </section>
      )}

      {isOrganizer ? (
        <EventFinanceForOrganizer
          isCompleted={isCompleted}
          pricePerPlayer={event.price_per_player}
          venueCost={event.venue_cost}
          venuePaid={event.venue_paid}
          attendances={attendances}
          yesCount={yesAttendances.length}
        />
      ) : (
        <EventFinanceForPlayer
          pricePerPlayer={event.price_per_player}
          isCompleted={isCompleted}
          myPaid={myPaid}
        />
      )}

      {isOrganizer && (
        <EventManagement
          isPublic={event.is_public}
          status={event.status}
          onTogglePublic={() => patchEvent({ is_public: !event.is_public })}
          onComplete={() => patchEvent({ status: "completed" })}
          onCancel={() => patchEvent({ status: "cancelled" })}
        />
      )}

      <EventAttendeesSheet
        open={attSheetOpen}
        attendances={attendances}
        totalMembers={totalMembers}
        isOrganizer={isOrganizer}
        isCompleted={isCompleted}
        onAttendedToggle={isOrganizer ? handleAttendedToggle : undefined}
        onClose={() => setAttSheetOpen(false)}
      />
    </div>
  );
}

function PastModeStatus({ attended }: { attended: boolean | null }) {
  const [bg, color, label] =
    attended === true
      ? ["var(--green-50)", "var(--green-700)", "✓ Вы были"]
      : attended === false
        ? ["oklch(0.95 0.06 25)", "var(--danger)", "Вы не пришли"]
        : ["var(--gray-100)", "var(--text-secondary)", "Присутствие ещё не отмечено"];

  return (
    <section className="px-4 mt-5">
      <div
        className="rounded-xl px-4 py-3 text-[14px] font-semibold"
        style={{ background: bg, color }}
      >
        {label}
      </div>
    </section>
  );
}
