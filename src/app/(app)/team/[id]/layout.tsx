"use client";

import { use, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TeamProvider, useTeam } from "./team-context";
import {
  PageHeader,
  HeaderStatGroup,
  HeaderStat,
} from "@/components/ui/PageHeader";
import { UnderlineTabs, type UnderlineTab } from "@/components/ui/UnderlineTabs";
import { TeamSwitcherSheet } from "@/components/teams/TeamSwitcherSheet";
import { TeamRequestsSheet } from "@/components/team/TeamRequestsSheet";
import { useAuth } from "@/lib/auth-context";
import { setLastActiveTeamId } from "@/lib/lastActiveTeam";
import { SPORT_LABEL } from "@/lib/catalogs";
import { formatMoney } from "@/lib/format";

const ROSTER_PATH_RE = /\/team\/[^/]+\/roster(\/|$)/;
const EVENT_DETAIL_PATH_RE = /\/team\/[^/]+\/events\/[^/]+/;

type TeamSubTabDef = {
  label: string;
  href: (id: string) => string;
  exact?: boolean;
  organizerOnly?: boolean;
};

const SUB_TABS: TeamSubTabDef[] = [
  { label: "Главная", href: (id) => `/team/${id}`, exact: true },
  { label: "Состав", href: (id) => `/team/${id}/roster` },
  { label: "События", href: (id) => `/team/${id}/events` },
  { label: "Финансы", href: (id) => `/team/${id}/finances`, organizerOnly: true },
];

function TeamPageHeader({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [myTeamCount, setMyTeamCount] = useState(0);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let cancelled = false;
    fetch(`/api/users/${auth.user.id}/teams`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setMyTeamCount((d.teams ?? []).length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auth]);

  if (team.status === "loading") {
    return (
      <div
        className="h-[172px] animate-pulse"
        style={{ background: "var(--green-600)", borderRadius: "0 0 28px 28px" }}
      />
    );
  }

  if (team.status !== "ready") return null;

  const { team: t, members, role, teamStats, pendingRequestsCount } = team;
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const isOrganizer = role === "organizer";
  const sportLabel = SPORT_LABEL[t.sport] ?? t.sport;
  const hasMultiple = myTeamCount >= 2;

  const titleSlot = hasMultiple ? (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      className="flex items-center gap-1.5 min-w-0"
    >
      <span
        className="font-display font-bold uppercase text-white text-[30px] leading-none truncate"
        style={{ letterSpacing: "0.02em" }}
      >
        {t.name}
      </span>
      <ChevronDownIcon />
    </button>
  ) : undefined;

  const thirdStatValue = isOrganizer
    ? formatMoney(teamStats.totalPlayersDebt ?? 0)
    : String(teamStats.completedEvents);
  const thirdStatLabel = isOrganizer ? "Долгов" : "Сыграно";

  return (
    <>
      <PageHeader
        title={hasMultiple ? undefined : t.name}
        titleSlot={titleSlot}
        subtitle={`${t.city} · ${sportLabel}`}
        onBellClick={isOrganizer ? () => setRequestsOpen(true) : undefined}
        hasBellDot={isOrganizer && pendingRequestsCount > 0}
        bellAriaLabel="Заявки на вступление"
      >
        <HeaderStatGroup>
          <HeaderStat value={members.length} label="В составе" />
          <HeaderStat value={teamStats.plannedEvents} label="Впереди" />
          <HeaderStat value={thirdStatValue} label={thirdStatLabel} />
        </HeaderStatGroup>
      </PageHeader>

      {hasMultiple && (
        <TeamSwitcherSheet
          open={switcherOpen}
          currentTeamId={teamId}
          onClose={() => setSwitcherOpen(false)}
        />
      )}
      {isOrganizer && (
        <TeamRequestsSheet
          open={requestsOpen}
          teamId={teamId}
          userId={userId}
          onClose={() => setRequestsOpen(false)}
          onActionDone={() => team.reload()}
        />
      )}
    </>
  );
}

function TeamSubNav({ id }: { id: string }) {
  const pathname = usePathname();
  const team = useTeam();
  const isOrganizer = team.status === "ready" && team.role === "organizer";
  const reload = team.status === "ready" ? team.reload : undefined;

  const tabs: UnderlineTab[] = SUB_TABS
    .filter((tab) => !tab.organizerOnly || isOrganizer)
    .map((tab) => {
      const href = tab.href(id);
      const active = tab.exact
        ? pathname === href
        : pathname === href || pathname.startsWith(href + "/");
      return { href, label: tab.label, active, onClick: reload };
    });

  return (
    <UnderlineTabs
      tabs={tabs}
      className="sticky top-0 z-10 bg-white"
    />
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
      <TeamPageHeader teamId={id} />
      <TeamSubNav id={id} />
      <div className="flex flex-1 flex-col px-4 py-4 gap-4">{children}</div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
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
