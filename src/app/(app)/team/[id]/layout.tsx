"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { TeamProvider, useTeam } from "./team-context";
import BackButton from "@/components/BackButton";


type TeamSubTab = {
  label: string;
  href: (id: string) => string;
  /** Active when pathname matches exactly this resolved href. */
  exact?: boolean;
  organizerOnly?: boolean;
};

const subTabs: TeamSubTab[] = [
  { label: "Главная", href: (id) => `/team/${id}`, exact: true },
  { label: "Состав", href: (id) => `/team/${id}/roster` },
  { label: "События", href: (id) => `/team/${id}/events` },
  { label: "Финансы", href: (id) => `/team/${id}/finances`, organizerOnly: true },
];

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

function TeamHeader() {
  const team = useTeam();

  if (team.status === "loading") {
    return (
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Команда</p>
        <div className="h-8 w-48 rounded bg-foreground-on-dark-muted/20 mt-2 animate-pulse" />
        <div className="h-4 w-32 rounded bg-foreground-on-dark-muted/20 mt-2 animate-pulse" />
      </div>
    );
  }

  if (team.status === "not_found") {
    return (
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <h1 className="text-2xl font-display font-bold uppercase">Команда не найдена</h1>
      </div>
    );
  }

  if (team.status === "error") {
    return (
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <h1 className="text-2xl font-display font-bold uppercase">{team.message}</h1>
      </div>
    );
  }

  const sportLabel = SPORT_LABEL[team.team.sport] ?? team.team.sport;

  return (
    <div className="relative bg-background-dark text-foreground-on-dark rounded-lg p-6">
      <BackButton fallbackHref="/teams" className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm text-white" />
      <p className="text-foreground-on-dark-muted text-sm uppercase font-display pl-10">Команда</p>
      <h1 className="text-3xl font-display font-bold uppercase mt-1">{team.team.name}</h1>
      <p className="text-foreground-on-dark-muted text-sm mt-1">
        {team.team.city} · {sportLabel}
      </p>
    </div>
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
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-background-card text-foreground border border-border"
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
      <div className="flex flex-1 flex-col">
        <div className="px-6 pt-6 pb-4">
          <TeamHeader />
        </div>

        <TeamSubNav id={id} />

        <div className="flex flex-1 flex-col px-6 py-4 gap-4">{children}</div>
      </div>
    </TeamProvider>
  );
}
