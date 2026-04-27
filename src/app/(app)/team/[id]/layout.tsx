"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect, useState } from "react";
import { TeamProvider, useTeam } from "./team-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { TeamSwitcherSheet } from "@/components/teams/TeamSwitcherSheet";
import { useAuth } from "@/lib/auth-context";
import { setLastActiveTeamId } from "@/lib/lastActiveTeam";
import { SPORT_LABEL } from "@/lib/catalogs";

const ROSTER_PATH_RE = /\/team\/[^/]+\/roster(\/|$)/;
const EVENT_DETAIL_PATH_RE = /\/team\/[^/]+\/events\/[^/]+/;

type TeamSubTab = {
  label: string;
  href: (id: string) => string;
  exact?: boolean;
  organizerOnly?: boolean;
};

const subTabs: TeamSubTab[] = [
  { label: "Главная", href: (id) => `/team/${id}`, exact: true },
  { label: "Состав", href: (id) => `/team/${id}/roster` },
  { label: "События", href: (id) => `/team/${id}/events` },
  { label: "Финансы", href: (id) => `/team/${id}/finances`, organizerOnly: true },
];

function TeamScreenHeader({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [myTeamCount, setMyTeamCount] = useState(0);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") {
      setMyTeamCount(0);
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${auth.user.id}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMyTeamCount((d.teams ?? []).length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (team.status === "loading") {
    return (
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-background-muted animate-pulse shrink-0" />
        <div className="flex-1">
          <div className="h-7 w-48 bg-background-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-background-muted rounded animate-pulse mt-1" />
        </div>
      </header>
    );
  }

  if (team.status !== "ready") {
    return <ScreenHeader title="Команда не найдена" fallbackHref="/teams" />;
  }

  const sportLabel = SPORT_LABEL[team.team.sport] ?? team.team.sport;
  const hasMultiple = myTeamCount >= 2;
  const titleNode = hasMultiple ? (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      className="flex items-center gap-1.5 min-w-0 text-left"
    >
      <h1 className="text-[28px] font-bold leading-tight truncate">
        {team.team.name}
      </h1>
      <ChevronDownIcon />
    </button>
  ) : (
    <h1 className="text-[28px] font-bold leading-tight truncate">
      {team.team.name}
    </h1>
  );

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            {titleNode}
            <p className="text-[13px] text-foreground-secondary">
              {team.team.city} · {sportLabel}
            </p>
          </div>
        </div>
      </header>
      {hasMultiple && (
        <TeamSwitcherSheet
          open={switcherOpen}
          currentTeamId={teamId}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
    </>
  );
}

function TeamSubNav({ id }: { id: string }) {
  const pathname = usePathname();
  const team = useTeam();
  const isOrganizer = team.status === "ready" && team.role === "organizer";
  const visibleTabs = subTabs.filter((tab) => !tab.organizerOnly || isOrganizer);
  const reload = team.status === "ready" ? team.reload : null;

  return (
    <nav className="px-4 pb-2 sticky top-0 z-10 bg-background">
      <div className="flex justify-center gap-1.5 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const href = tab.href(id);
          const isActive = tab.exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => reload?.()}
              className={`rounded-full px-3 py-1 inline-flex items-center justify-center whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-card text-[13px] font-semibold"
                  : "bg-background-card text-foreground border border-border text-[13px] font-medium"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function TeamLayoutInner({ id, children }: { id: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname ?? "";
  const isRoster = ROSTER_PATH_RE.test(path);
  const isEventDetail = EVENT_DETAIL_PATH_RE.test(path);

  useEffect(() => {
    setLastActiveTeamId(id);
  }, [id]);

  if (isRoster || isEventDetail) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <TeamScreenHeader teamId={id} />
      <TeamSubNav id={id} />
      <div className="flex flex-1 flex-col px-4 py-4 gap-4">{children}</div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      style={{ color: "var(--text-tertiary)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <TeamProvider teamId={id}>
      <TeamLayoutInner id={id}>{children}</TeamLayoutInner>
    </TeamProvider>
  );
}
