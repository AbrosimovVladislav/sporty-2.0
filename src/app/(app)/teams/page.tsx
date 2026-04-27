"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getLastActiveTeamId,
  setLastActiveTeamId,
} from "@/lib/lastActiveTeam";
import {
  PageHeader,
  HeaderStatGroup,
  HeaderStat,
  EmptyState,
} from "@/components/ui";
import { SkeletonList } from "@/components/Skeleton";

type MyTeam = {
  id: string;
  role: "organizer" | "player";
};

export default function MyTeamsPage() {
  const auth = useAuth();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "empty" | "redirecting">(
    "loading",
  );

  useEffect(() => {
    if (auth.status === "loading") return;
    if (auth.status !== "authenticated") {
      setState("empty");
      return;
    }

    const userId = auth.user.id;
    let cancelled = false;

    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const teams = (d.teams ?? []) as MyTeam[];
        if (teams.length === 0) {
          setState("empty");
          return;
        }
        const lastId = getLastActiveTeamId();
        const target =
          (lastId && teams.find((t) => t.id === lastId)?.id) ?? teams[0].id;
        setLastActiveTeamId(target);
        setState("redirecting");
        router.replace(`/team/${target}`);
      })
      .catch(() => {
        if (!cancelled) setState("empty");
      });

    return () => {
      cancelled = true;
    };
  }, [auth, router]);

  if (state === "loading" || state === "redirecting") {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="Моя команда">
          <HeaderStatGroup>
            <HeaderStat value="—" label="Команд" />
          </HeaderStatGroup>
        </PageHeader>
        <div className="px-4 mt-5">
          <SkeletonList count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Моя команда" />

      <div className="px-4 mt-8 flex flex-col items-center text-center">
        <EmptyState
          text={
            auth.status === "authenticated"
              ? "У тебя пока нет команды. Найди существующую или создай свою."
              : "Войди, чтобы видеть свои команды."
          }
        />
        {auth.status === "authenticated" && (
          <div className="flex flex-col gap-2 w-full mt-2 max-w-[320px]">
            <Link
              href="/search/teams"
              className="block w-full text-center py-3 rounded-[14px] text-[14px] font-bold"
              style={{ background: "var(--green-500)", color: "white" }}
            >
              Найти команду
            </Link>
            <Link
              href="/teams/create"
              className="block w-full text-center py-3 rounded-[14px] text-[14px] font-semibold"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1.5px solid var(--gray-200)",
              }}
            >
              Создать команду
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
