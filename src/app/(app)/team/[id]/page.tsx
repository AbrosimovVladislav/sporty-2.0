"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  const { role, teamStats } = team;
  const isOrganizer = role === "organizer";
  const isEmpty =
    teamStats.completedEvents === 0 && teamStats.plannedEvents === 0;

  return (
    <>
      {role === "guest" && <GuestJoinBar teamId={team.team.id} />}

      {isEmpty ? (
        <EmptyTeamHome teamId={team.team.id} canCreate={isOrganizer} />
      ) : (
        <>
          <NextEventCard insights={insights} teamId={team.team.id} />

          {isOrganizer && (
            <TeamRequestsSection
              teamId={team.team.id}
              userId={userId}
              onResolved={team.reload}
            />
          )}

          <ActivityCard insights={insights} />

          <TopPlayersCard
            insights={insights}
            onPlayerClick={handleLeaderClick}
          />

          {isOrganizer && (
            <FinanceCard metrics={financeMetrics} teamId={team.team.id} />
          )}
        </>
      )}

      {role !== "guest" && (
        <Link
          href="/teams/create"
          className="rounded-[16px] px-4 py-3.5 flex items-center gap-3 text-left active:opacity-90 transition-opacity"
          style={{
            background: "var(--card)",
            border: "1px dashed var(--ink-200)",
          }}
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--ink-100)", color: "var(--ink-700)" }}
          >
            <PlusIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--ink-900)" }}
            >
              Создать новую команду
            </p>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "var(--ink-500)" }}
            >
              Ты станешь её первым организатором
            </p>
          </div>
          <span className="shrink-0" style={{ color: "var(--ink-400)" }}>
            <ChevronRightIcon />
          </span>
        </Link>
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

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
