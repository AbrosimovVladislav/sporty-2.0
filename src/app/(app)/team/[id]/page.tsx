"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTeam, type TeamMember } from "./team-context";
import { useTeamUI } from "./team-ui-context";
import { TeamPlayerSheet } from "@/components/team/lazy";
import { ActivityCard } from "./_components/ActivityCard";
import { EmptyTeamHome } from "./_components/EmptyTeamHome";
import { FinanceCard } from "./_components/FinanceCard";
import { GuestJoinBar } from "./_components/GuestJoinBar";
import { NextEventCard } from "./_components/NextEventCard";
import { RequestsCounter } from "./_components/RequestsCounter";
import { SkeletonHome } from "./_components/SkeletonHome";
import { TopPlayersCard } from "./_components/TopPlayersCard";
import type { Insights } from "./_components/types";

export default function TeamHomePage() {
  const team = useTeam();
  const auth = useAuth();
  const ui = useTeamUI();
  const router = useRouter();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;

  const [insights, setInsights] = useState<Insights | null | undefined>(
    undefined,
  );
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
      <NextEventCard insights={insights} teamId={team.team.id} />

      <ActivityCard insights={insights} />

      <TopPlayersCard insights={insights} onPlayerClick={handleLeaderClick} />

      {isOrganizer && (
        <FinanceCard insights={insights} teamId={team.team.id} />
      )}

      {isOrganizer && pendingRequestsCount > 0 && (
        <RequestsCounter
          count={pendingRequestsCount}
          onOpen={ui.openRequests}
        />
      )}

      {role === "guest" && <GuestJoinBar teamId={team.team.id} />}

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
