"use client";

import { use, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { TeamProvider, useTeam } from "./team-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { UnderlineTabs, type UnderlineTab } from "@/components/ui/UnderlineTabs";
import { TeamSwitcherSheet } from "@/components/teams/TeamSwitcherSheet";
import { useAuth } from "@/lib/auth-context";
import { setLastActiveTeamId } from "@/lib/lastActiveTeam";
import { SPORT_LABEL } from "@/lib/catalogs";
import { teamGradient } from "@/lib/format";

const ROSTER_PATH_RE = /\/team\/[^/]+\/roster(\/|$)/;
const EVENT_DETAIL_PATH_RE = /\/team\/[^/]+\/events\/[^/]+/;
const SETTINGS_PATH_RE = /\/team\/[^/]+\/settings(\/|$)/;

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
  const router = useRouter();
  const [myTeamCount, setMyTeamCount] = useState(0);
  const [switcherOpen, setSwitcherOpen] = useState(false);

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

  const { team: t, role } = team;
  const isOrganizer = role === "organizer";
  const sportLabel = SPORT_LABEL[t.sport] ?? t.sport;
  const hasMultiple = myTeamCount >= 2;

  const titleSlot = hasMultiple ? (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      className="flex items-start gap-1.5 min-w-0 w-full text-left"
    >
      <span
        className="font-display font-bold uppercase text-white text-[22px] leading-[1.1] line-clamp-2 wrap-break-word flex-1 min-w-0"
        style={{ letterSpacing: "0.02em" }}
      >
        {t.name}
      </span>
      <span className="shrink-0 mt-1.5">
        <ChevronDownIcon />
      </span>
    </button>
  ) : undefined;

  const initial = t.name.trim().charAt(0).toUpperCase() || "?";
  const leadingSlot = (
    <div className="relative shrink-0">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: t.logo_url ? "white" : teamGradient(t.id),
          border: "2px solid rgba(255,255,255,0.25)",
        }}
      >
        {t.logo_url ? (
          <Image
            src={t.logo_url}
            alt=""
            width={56}
            height={56}
            sizes="56px"
            priority
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-[24px] font-bold text-white leading-none">
            {initial}
          </span>
        )}
      </div>
    </div>
  );


  return (
    <>
      <PageHeader
        title={hasMultiple ? undefined : t.name}
        titleSlot={titleSlot}
        subtitle={`${t.city} · ${sportLabel}`}
        leadingSlot={leadingSlot}
        onSettingsClick={isOrganizer ? () => router.push(`/team/${teamId}/settings`) : undefined}
        settingsAriaLabel="Настройки команды"
      />

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

  const tabs: UnderlineTab[] = SUB_TABS
    .filter((tab) => !tab.organizerOnly || isOrganizer)
    .map((tab) => {
      const href = tab.href(id);
      const active = tab.exact
        ? pathname === href
        : pathname === href || pathname.startsWith(href + "/");
      return { href, label: tab.label, active };
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
  const isSettings = SETTINGS_PATH_RE.test(path);

  useEffect(() => {
    setLastActiveTeamId(id);
  }, [id]);

  if (isEventDetail || isSettings) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  const contentClass = isRoster
    ? "flex flex-1 flex-col"
    : "flex flex-1 flex-col px-4 py-4 gap-4";

  return (
    <div className="flex flex-1 flex-col">
      <TeamPageHeader teamId={id} />
      <TeamSubNav id={id} />
      <div className={contentClass}>{children}</div>
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
