"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import type { Team } from "@/types/database";

export type TeamRole = "organizer" | "player" | "guest";
export type JoinRequestStatus = "none" | "pending" | "rejected";

export type TeamMember = {
  id: string;
  role: "organizer" | "player";
  joined_at: string;
  user: {
    id: string;
    name: string;
    city: string | null;
    sport: string | null;
    position: string[] | null;
    skill_level: string | null;
    avatar_url: string | null;
  };
};

export type TeamStats = {
  completedEvents: number;
  plannedEvents: number;
  totalPlayersDebt: number | null;
};

type ReadyTeamData = {
  team: Team;
  members: TeamMember[];
  role: TeamRole;
  joinRequestStatus: JoinRequestStatus;
  joinRequestId: string | null;
  joinRequestCooldownUntil: string | null;
  pendingRequestsCount: number;
  teamStats: TeamStats;
};

export type TeamState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | (ReadyTeamData & { status: "ready"; reload: () => void });

const TeamContext = createContext<TeamState>({ status: "loading" });

const cacheKey = (teamId: string, userId: string | null) => `${teamId}::${userId ?? "guest"}`;
const teamCache = new Map<string, ReadyTeamData>();

export function TeamProvider({ teamId, children }: { teamId: string; children: ReactNode }) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;

  const [state, setState] = useState<TeamState>(() => {
    const cached = teamCache.get(cacheKey(teamId, userId));
    if (cached) {
      return { status: "ready", ...cached, reload: () => {} };
    }
    return { status: "loading" };
  });
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (auth.status === "loading") return;

    const key = cacheKey(teamId, userId);
    let cancelled = false;

    async function load() {
      try {
        const url = userId ? `/api/teams/${teamId}?userId=${userId}` : `/api/teams/${teamId}`;
        const res = await fetch(url);
        if (cancelled) return;

        if (res.status === 404) {
          teamCache.delete(key);
          setState({ status: "not_found" });
          return;
        }
        if (!res.ok) {
          setState((prev) => prev.status === "ready"
            ? prev
            : { status: "error", message: "Не удалось загрузить команду" });
          return;
        }
        const data = await res.json();
        const next: ReadyTeamData = {
          team: data.team,
          members: data.members ?? [],
          role: data.currentRole,
          joinRequestStatus: data.joinRequestStatus ?? "none",
          joinRequestId: data.joinRequestId ?? null,
          joinRequestCooldownUntil: data.joinRequestCooldownUntil ?? null,
          pendingRequestsCount: data.pendingRequestsCount ?? 0,
          teamStats: data.teamStats ?? { completedEvents: 0, plannedEvents: 0, totalPlayersDebt: null },
        };
        teamCache.set(key, next);
        setState({ status: "ready", ...next, reload });
      } catch {
        if (cancelled) return;
        setState((prev) => prev.status === "ready"
          ? prev
          : { status: "error", message: "Сеть недоступна" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [teamId, userId, auth.status, version, reload]);

  const value = useMemo<TeamState>(() => {
    if (state.status === "ready") return { ...state, reload };
    return state;
  }, [state, reload]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  return useContext(TeamContext);
}
