"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "./team-context";
import { Skeleton } from "@/components/Skeleton";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { MiniStatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Button } from "@/components/ui/Button";
import { BottomActionBar } from "@/components/ui/BottomActionBar";

export default function TeamHomePage() {
  const team = useTeam();

  if (team.status === "loading") {
    return <SkeletonBlock />;
  }

  if (team.status === "not_found" || team.status === "error") {
    return null;
  }

  const { members, role, pendingRequestsCount, teamStats } = team;
  const totalCount = members.length;

  return (
    <>
      {/* 27.2.1 Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/team/${team.team.id}/roster`} className="block">
          <MiniStatCard value={totalCount} label="в составе" className="w-full" />
        </Link>
        <Link href={`/team/${team.team.id}/events`} className="block">
          <MiniStatCard value={teamStats.plannedEvents} label="запланировано" className="w-full" />
        </Link>
        <Link href={`/team/${team.team.id}/events`} className="block">
          <MiniStatCard value={teamStats.completedEvents} label="проведено" color="primary" className="w-full" />
        </Link>
        {role === "organizer" && (
          <Link href={`/team/${team.team.id}/finances`} className="block">
            <FinanceMiniCard teamId={team.team.id} />
          </Link>
        )}
      </div>

      {/* Next event */}
      <NextEventBlock teamId={team.team.id} />

      {/* Organizer tools */}
      {role === "organizer" && (
        <>
          {/* 27.2.3 Incoming requests — only when count > 0 */}
          {pendingRequestsCount > 0 && (
            <IncomingRequestsBlock
              teamId={team.team.id}
              count={pendingRequestsCount}
              onChanged={team.reload}
            />
          )}

          {/* 27.2.2 Management section with looking-for-players toggle */}
          <section>
            <SectionEyebrow tone="muted" className="mb-2">Управление</SectionEyebrow>
            <Card padding="sm">
              <LookingForPlayersRow
                teamId={team.team.id}
                initial={team.team.looking_for_players}
              />
            </Card>
          </section>
        </>
      )}

      {/* 27.2.4 Guest — BottomActionBar */}
      {role === "guest" && <GuestJoinBar teamId={team.team.id} />}
    </>
  );
}

function FinanceMiniCard({ teamId }: { teamId: string }) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/teams/${teamId}/finances?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setBalance(d.metrics.realBalance);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [teamId, userId]);

  const color =
    balance === null ? "default" : balance >= 0 ? "primary" : "danger";

  return (
    <MiniStatCard
      value={balance === null ? "…" : `${balance >= 0 ? "+" : ""}${balance} ₸`}
      label="баланс"
      color={color}
      className="w-full"
    />
  );
}

type NextEvent = {
  id: string;
  type: string;
  date: string;
  venue: { name: string } | null;
  yesCount: number;
};

function NextEventBlock({ teamId }: { teamId: string }) {
  const auth = useAuth();
  const [event, setEvent] = useState<NextEvent | null | undefined>(undefined);
  const userId = auth.status === "authenticated" ? auth.user.id : null;

  useEffect(() => {
    let cancelled = false;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/next-event${params}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setEvent(d.event ?? null); })
      .catch(() => { if (!cancelled) setEvent(null); });
    return () => { cancelled = true; };
  }, [teamId, userId]);

  if (event === undefined) {
    return (
      <Card padding="md">
        <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-foreground-secondary mb-2">
          Ближайшее событие
        </p>
        <Skeleton className="h-6 w-40" />
      </Card>
    );
  }

  if (event === null) return null;

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/team/${teamId}/events/${event.id}`}>
      <Card padding="md">
        <SectionEyebrow tone="muted" className="mb-2">Ближайшее событие</SectionEyebrow>
        <p className="text-[17px] font-semibold">
          {EVENT_TYPE_LABEL[event.type] ?? event.type} — {dateStr}
        </p>
        {event.venue && (
          <p className="text-[13px] text-foreground-secondary mt-1">{event.venue.name}</p>
        )}
        <p className="text-[13px] text-foreground-secondary mt-0.5">
          Придут: {event.yesCount}
        </p>
      </Card>
    </Link>
  );
}

type RequestItem = {
  id: string;
  user_id: string;
  created_at: string;
  user: { id: string; name: string; city: string | null };
};

function IncomingRequestsBlock({
  teamId,
  count,
  onChanged,
}: {
  teamId: string;
  count: number;
  onChanged: () => void;
}) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const [requests, setRequests] = useState<RequestItem[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  async function loadRequests() {
    if (!userId) return;
    setExpanded(true);
    const res = await fetch(`/api/teams/${teamId}/join-requests?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests ?? []);
    }
  }

  async function handleAction(requestId: string, action: "accept" | "reject") {
    if (!userId) return;
    setProcessing(requestId);
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      setRequests((prev) => (prev ? prev.filter((r) => r.id !== requestId) : null));
      onChanged();
    } finally {
      setProcessing(null);
    }
  }

  if (!expanded) {
    return (
      <Card padding="md">
        <SectionEyebrow tone="primary" className="mb-2">Входящие заявки</SectionEyebrow>
        <button
          onClick={loadRequests}
          className="text-[15px] font-semibold text-primary"
        >
          Посмотреть {requestsLabel(count)}
        </button>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <SectionEyebrow tone="primary" className="mb-3">Входящие заявки</SectionEyebrow>
      {requests === null ? (
        <Skeleton className="h-10" />
      ) : requests.length === 0 ? (
        <p className="text-[14px] text-foreground-secondary">Новых заявок нет</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold truncate">{r.user.name}</p>
                {r.user.city && (
                  <p className="text-[13px] text-foreground-secondary">{r.user.city}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0 ml-3">
                <Button
                  variant="primary"
                  size="md"
                  loading={processing === r.id}
                  onClick={() => handleAction(r.id, "accept")}
                >
                  Принять
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  loading={processing === r.id}
                  onClick={() => handleAction(r.id, "reject")}
                >
                  Отклонить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LookingForPlayersRow({ teamId, initial }: { teamId: string; initial: boolean }) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (!userId || saving) return;
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, looking_for_players: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div>
        <p className="text-[15px] font-semibold">Набор игроков</p>
        <p className="text-[13px] text-foreground-secondary">{enabled ? "Открыт" : "Закрыт"}</p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          enabled ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function GuestJoinBar({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [sending, setSending] = useState(false);

  if (team.status !== "ready") return null;

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { joinRequestStatus, reload } = team;

  async function handleJoin() {
    if (!userId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) reload();
    } finally {
      setSending(false);
    }
  }

  if (joinRequestStatus === "pending") {
    return (
      <BottomActionBar>
        <Button variant="secondary" className="w-full" onClick={() => {}}>
          Заявка отправлена
        </Button>
      </BottomActionBar>
    );
  }

  if (joinRequestStatus === "rejected") {
    return (
      <BottomActionBar>
        <Button variant="secondary" className="w-full" onClick={() => {}}>
          Заявка отклонена
        </Button>
      </BottomActionBar>
    );
  }

  return (
    <BottomActionBar>
      <Button
        variant="primary"
        className="w-full"
        loading={sending}
        onClick={handleJoin}
      >
        Подать заявку
      </Button>
    </BottomActionBar>
  );
}

function SkeletonBlock() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-background-card rounded-lg p-4 shadow-card">
          <Skeleton className="h-7 w-12 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function requestsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} заявку`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} заявки`;
  return `${n} заявок`;
}
