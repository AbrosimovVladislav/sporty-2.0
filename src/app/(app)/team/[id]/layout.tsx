"use client";

import { use, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TeamProvider, useTeam } from "./team-context";
import { TeamUIProvider } from "./team-ui-context";
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
import { formatMoney, teamGradient } from "@/lib/format";

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

function TeamPageHeader({
  teamId,
  requestsOpen,
  setRequestsOpen,
}: {
  teamId: string;
  requestsOpen: boolean;
  setRequestsOpen: (v: boolean) => void;
}) {
  const team = useTeam();
  const auth = useAuth();
  const [myTeamCount, setMyTeamCount] = useState(0);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;

  useEffect(() => {
    if (!logoError) return;
    const t = setTimeout(() => setLogoError(null), 3000);
    return () => clearTimeout(t);
  }, [logoError]);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let cancelled = false;
    fetch(`/api/users/${auth.user.id}/teams`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setMyTeamCount((d.teams ?? []).length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auth]);

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId || team.status !== "ready") return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", userId);
      const res = await fetch(`/api/teams/${teamId}/logo`, { method: "POST", body: fd });
      if (res.ok) {
        team.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setLogoError(data.error ?? "Не удалось загрузить");
      }
    } catch {
      setLogoError("Сеть недоступна");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

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

  const initial = t.name.trim().charAt(0).toUpperCase() || "?";
  const leadingSlot = (
    <div className="relative shrink-0">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: t.logo_url ? "white" : teamGradient(t.id),
          border: "2px solid rgba(255,255,255,0.25)",
          opacity: logoUploading ? 0.6 : 1,
        }}
      >
        {t.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-[24px] font-bold text-white leading-none">
            {initial}
          </span>
        )}
      </div>
      {isOrganizer && (
        <>
          <label
            htmlFor="team-logo-upload"
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: logoUploading ? "var(--gray-400)" : "var(--green-500)", border: "2px solid white" }}
            aria-label="Загрузить лого"
          >
            {logoUploading ? (
              <span className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin block" />
            ) : (
              <CameraIcon />
            )}
          </label>
          <input
            id="team-logo-upload"
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={logoUploading}
            onChange={handleLogoFile}
          />
        </>
      )}
    </div>
  );


  return (
    <>
      <PageHeader
        title={hasMultiple ? undefined : t.name}
        titleSlot={titleSlot}
        subtitle={`${t.city} · ${sportLabel}`}
        leadingSlot={leadingSlot}
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
      {logoError && (
        <div
          className="mx-4 mt-2 px-3 py-2 rounded-xl text-[13px] text-center"
          style={{ background: "#FFF1F1", color: "#E53935" }}
        >
          {logoError}
        </div>
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
  const [requestsOpen, setRequestsOpen] = useState(false);

  useEffect(() => {
    setLastActiveTeamId(id);
  }, [id]);

  const ui = { openRequests: () => setRequestsOpen(true) };

  if (isEventDetail) {
    return (
      <TeamUIProvider value={ui}>
        <div className="flex flex-1 flex-col">{children}</div>
      </TeamUIProvider>
    );
  }

  const contentClass = isRoster
    ? "flex flex-1 flex-col"
    : "flex flex-1 flex-col px-4 py-4 gap-4";

  return (
    <TeamUIProvider value={ui}>
      <div className="flex flex-1 flex-col">
        <TeamPageHeader
          teamId={id}
          requestsOpen={requestsOpen}
          setRequestsOpen={setRequestsOpen}
        />
        <TeamSubNav id={id} />
        <div className={contentClass}>{children}</div>
      </div>
    </TeamUIProvider>
  );
}

function CameraIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
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
