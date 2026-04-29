"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ShieldIcon } from "@/components/Icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { HomeHero } from "@/components/home/HomeHero";
import { HeroEventCard } from "@/components/home/HeroEventCard";
import { RequestsCard } from "@/components/home/RequestsCard";
import { RequestsSheet } from "@/components/home/RequestsSheet";
import { QuickActions } from "@/components/home/QuickActions";
import { TeamPulseSection } from "@/components/home/TeamPulseSection";
import { ScheduleSection } from "@/components/home/ScheduleSection";
import { useCity } from "@/lib/city-context";

type NextEvent = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  price_per_player: number;
  min_players: number;
  is_public: boolean;
  team: { id: string; name: string } | null;
  venue: { id: string; name: string; address: string; photo_url: string | null } | null;
  yes_count: number;
  no_count: number;
  waiting_count: number;
  total_members: number;
  user_vote: "yes" | "no" | null;
};

type PulseTeam = {
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

type ScheduleEvent = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  team: { id: string; name: string } | null;
  venue: { id: string; name: string; photo_url: string | null } | null;
  user_vote: "yes" | "no" | null;
};

type RequestSummary = {
  total: number;
  by_team: { team_id: string; team_name: string; count: number }[];
};

export default function HomePage() {
  const auth = useAuth();
  const router = useRouter();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const name = auth.status === "authenticated" ? auth.user.name : "";

  const [nextEvent, setNextEvent] = useState<NextEvent | null | undefined>(undefined);
  const [requests, setRequests] = useState<RequestSummary>({ total: 0, by_team: [] });
  const [pulseTeams, setPulseTeams] = useState<PulseTeam[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { activeCity } = useCity();

  // Telegram deep-link
  useEffect(() => {
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (!startParam) return;
    const match = startParam.match(/^event_([^_]+)_(.+)$/);
    if (match) router.replace(`/team/${match[1]}/events/${match[2]}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) {
      setNextEvent(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/users/${userId}/next-event`).then((r) => r.json()),
      fetch(`/api/users/${userId}/pending-requests`).then((r) => r.json()),
      fetch(`/api/users/${userId}/teams-pulse`).then((r) => r.json()),
    ])
      .then(async ([ne, req, pulse]) => {
        if (cancelled) return;
        const heroEvent: NextEvent | null = ne.event ?? null;
        setNextEvent(heroEvent);
        setRequests({ total: req.total ?? 0, by_team: req.by_team ?? [] });
        setPulseTeams(pulse.teams ?? []);

        const scheduleUrl = heroEvent
          ? `/api/users/${userId}/schedule?limit=3&excludeId=${heroEvent.id}`
          : `/api/users/${userId}/schedule?limit=3`;
        const sched = await fetch(scheduleUrl).then((r) => r.json());
        if (!cancelled) setSchedule(sched.events ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setNextEvent(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function handleVoteChange(vote: "yes" | "no") {
    setNextEvent((prev) => {
      if (!prev) return prev;
      const wasYes = prev.user_vote === "yes";
      const wasNo = prev.user_vote === "no";
      const willYes = vote === "yes";
      const willNo = vote === "no";
      return {
        ...prev,
        user_vote: vote,
        yes_count: prev.yes_count + (willYes ? 1 : 0) - (wasYes ? 1 : 0),
        no_count: prev.no_count + (willNo ? 1 : 0) - (wasNo ? 1 : 0),
        waiting_count: prev.waiting_count - (prev.user_vote === null ? 1 : 0),
      };
    });
  }

  const isOrganizer = pulseTeams.some((t) => t.role === "organizer");
  const showEmptyState = !loading && !nextEvent && pulseTeams.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <HomeHero
        name={name}
        city={activeCity}
        hasRequests={isOrganizer && requests.total > 0}
        onBellClick={() => setRequestsOpen(true)}
        onProfileClick={() => router.push("/profile")}
      >
        {loading ? (
          <div
            className="rounded-[20px] h-[280px]"
            style={{ background: "rgba(0,0,0,0.18)" }}
          />
        ) : nextEvent && userId ? (
          <HeroEventCard
            event={nextEvent}
            userId={userId}
            onVoteChange={handleVoteChange}
            photoUrl={nextEvent.venue?.photo_url ?? null}
          />
        ) : null}
      </HomeHero>

      {isOrganizer && requests.total > 0 && (
        <RequestsCard
          total={requests.total}
          byTeam={requests.by_team}
          onClick={() => setRequestsOpen(true)}
        />
      )}

      <QuickActions />

      <TeamPulseSection teams={pulseTeams} loading={loading} />

      <ScheduleSection events={schedule} loading={loading} />

      {showEmptyState && (
        <div className="px-4 mt-6">
          <EmptyState
            icon={<ShieldIcon />}
            text="Вступи в команду или найди событие, чтобы начать"
            action={{ label: "Найти событие", onClick: () => router.push("/search") }}
          />
        </div>
      )}

      <div className="h-4" />

      <RequestsSheet
        open={requestsOpen}
        byTeam={requests.by_team}
        onClose={() => setRequestsOpen(false)}
      />
    </div>
  );
}
