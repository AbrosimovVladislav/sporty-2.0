"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTeam, type TeamMember } from "./team-context";
import { TeamPlayerSheet } from "@/components/team/lazy";
import { ActivityCard } from "./_components/ActivityCard";
import { EmptyTeamHome } from "./_components/EmptyTeamHome";
import { FinanceCard } from "./_components/FinanceCard";
import { GuestJoinBar } from "./_components/GuestJoinBar";
import { NextEventCard } from "./_components/NextEventCard";
import { SkeletonHome } from "./_components/SkeletonHome";
import { TeamRequestsSection } from "./_components/TeamRequestsSection";
import { TopPlayersCard } from "./_components/TopPlayersCard";
import type { FinanceMetrics, Insights } from "./_components/types";

export default function TeamHomePage() {
  const team = useTeam();
  const auth = useAuth();
  const router = useRouter();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const isOrganizerRole =
    team.status === "ready" && team.role === "organizer";

  const [insights, setInsights] = useState<Insights | null | undefined>(
    undefined,
  );
  const [financeMetrics, setFinanceMetrics] = useState<
    FinanceMetrics | null | undefined
  >(undefined);
  const [activePlayer, setActivePlayer] = useState<TeamMember | null>(null);

  function handleLeaderClick(playerId: string) {
    if (team.status !== "ready") return;
    const member = team.members.find((m) => m.user.id === playerId);
    if (member) {
      setActivePlayer(member);
    } else {
      router.push(`/players/${playerId}`);
    }
  }

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/insights${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setInsights(d ?? null);
      })
      .catch(() => {
        if (!cancelled) setInsights(null);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, userId]);

  useEffect(() => {
    if (!teamId || !userId || !isOrganizerRole) {
      setFinanceMetrics(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/teams/${teamId}/finances?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setFinanceMetrics(d?.metrics ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setFinanceMetrics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, userId, isOrganizerRole]);

  if (team.status === "loading") {
    return <SkeletonHome />;
  }
  if (team.status !== "ready") return null;

  const { role, pendingRequestsCount, teamStats } = team;
  const isOrganizer = role === "organizer";
  const isEmpty =
    teamStats.completedEvents === 0 && teamStats.plannedEvents === 0;

  if (isEmpty) {
    return <EmptyTeamHome teamId={team.team.id} canCreate={isOrganizer} />;
  }

  return (
    <>
      {role === "guest" && <GuestJoinBar teamId={team.team.id} />}

      <NextEventCard insights={insights} teamId={team.team.id} />

      {isOrganizer && (
        <TeamRequestsSection
          teamId={team.team.id}
          userId={userId}
          pendingHint={pendingRequestsCount}
          onResolved={team.reload}
        />
      )}

      <ActivityCard insights={insights} />

      <TopPlayersCard insights={insights} onPlayerClick={handleLeaderClick} />

      {isOrganizer && (
        <FinanceCard metrics={financeMetrics} teamId={team.team.id} />
      )}

      {activePlayer && team.status === "ready" && (
        <TeamPlayerSheet
          member={activePlayer}
          teamId={team.team.id}
          currentUserId={userId}
          isOrganizer={isOrganizer}
          onClose={() => setActivePlayer(null)}
          onActionDone={() => {
            setActivePlayer(null);
            team.reload();
          }}
        />
      )}
    </>
  );
}
