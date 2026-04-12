"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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
  };
};

export type TeamState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      team: Team;
      members: TeamMember[];
      role: TeamRole;
      joinRequestStatus: JoinRequestStatus;
      pendingRequestsCount: number;
      reload: () => void;
    };

const TeamContext = createContext<TeamState>({ status: "loading" });

export function TeamProvider({ teamId, children }: { teamId: string; children: ReactNode }) {
  const auth = useAuth();
  const [state, setState] = useState<TeamState>({ status: "loading" });
  const [version, setVersion] = useState(0);

  const userId = auth.status === "authenticated" ? auth.user.id : null;

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (auth.status === "loading") return;

    let cancelled = false;

    async function load() {
      try {
        const url = userId ? `/api/teams/${teamId}?userId=${userId}` : `/api/teams/${teamId}`;
        const res = await fetch(url);
        if (cancelled) return;

        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (!res.ok) {
          setState({ status: "error", message: "Не удалось загрузить команду" });
          return;
        }
        const data = await res.json();
        setState({
          status: "ready",
          team: data.team,
          members: data.members ?? [],
          role: data.currentRole,
          joinRequestStatus: data.joinRequestStatus ?? "none",
          pendingRequestsCount: data.pendingRequestsCount ?? 0,
          reload,
        });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Сеть недоступна" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [teamId, userId, auth.status, version, reload]);

  return <TeamContext.Provider value={state}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  return useContext(TeamContext);
}
