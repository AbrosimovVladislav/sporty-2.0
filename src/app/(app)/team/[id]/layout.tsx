"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { TeamProvider, useTeam } from "./team-context";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
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

function TeamScreenHeader() {
  const team = useTeam();

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

  return (
    <ScreenHeader
      title={team.team.name}
      subtitle={`${team.team.city} · ${sportLabel}`}
      fallbackHref="/teams"
    />
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

  if (isRoster || isEventDetail) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <TeamScreenHeader />
      <TeamSubNav id={id} />
      <div className="flex flex-1 flex-col px-4 py-4 gap-4">{children}</div>
    </div>
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
