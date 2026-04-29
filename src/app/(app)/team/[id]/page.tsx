"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "./team-context";
import { useTeamUI } from "./team-ui-context";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { Button } from "@/components/ui/Button";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import {
  formatCountdown,
  formatCountdownLabel,
  formatPrice,
  formatMoney,
} from "@/lib/format";

type Insights = {
  nextEvent: {
    id: string;
    type: string;
    date: string;
    pricePerPlayer: number;
    venue: { id: string; name: string; photoUrl: string | null } | null;
    yesCount: number;
    totalMembers: number;
  } | null;
  activity: {
    eventsByWeek: { weekStart: string; count: number }[];
    eventsCount: number;
    eventsCountPrev: number;
    attendanceAvg: number;
    attendancePrevAvg: number;
  };
  topPlayers: {
    id: string;
    name: string;
    avatarUrl: string | null;
    played: number;
    attendancePct: number;
  }[];
  finance30d: {
    collected: number;
    venuePaid: number;
    netDelta: number;
    prevNetDelta: number;
  } | null;
};

export default function TeamHomePage() {
  const team = useTeam();
  const auth = useAuth();
  const ui = useTeamUI();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;

  const [insights, setInsights] = useState<Insights | null | undefined>(undefined);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/insights${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setInsights(d ?? null);
      })
      .catch(() => {
        if (!cancelled) setInsights(null);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, userId]);

  if (team.status === "loading") {
    return <SkeletonHome />;
  }
  if (team.status !== "ready") return null;

  const { role, pendingRequestsCount, teamStats } = team;
  const isOrganizer = role === "organizer";
  const isEmpty =
    teamStats.completedEvents === 0 && teamStats.plannedEvents === 0;

  if (isEmpty) {
    return <EmptyTeamHome teamId={team.team.id} canCreate={isOrganizer} />;
  }

  return (
    <>
      {/* Block 1 — Next event (primary) */}
      <NextEventCard insights={insights} teamId={team.team.id} />

      {/* Block 2 — Activity 30d */}
      <ActivityCard insights={insights} />

      {/* Block 3 — Top players */}
      <TopPlayersCard insights={insights} />

      {/* Block 4 — Finances 30d (organizer only) */}
      {isOrganizer && (
        <FinanceCard insights={insights} teamId={team.team.id} />
      )}

      {/* Block 5 — Requests counter (organizer only, if any pending) */}
      {isOrganizer && pendingRequestsCount > 0 && (
        <button
          type="button"
          onClick={ui.openRequests}
          className="rounded-[16px] px-4 py-3 flex items-center gap-3 text-left transition-colors active:bg-bg-card"
          style={{
            background: "var(--green-50)",
            border: "1px solid var(--green-100)",
          }}
        >
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--green-500)", color: "white" }}
          >
            <BellIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {requestsLabel(pendingRequestsCount)}
            </p>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Открыть и решить →
            </p>
          </div>
        </button>
      )}

      {/* Block 6 — Guest join bar */}
      {role === "guest" && <GuestJoinBar teamId={team.team.id} />}
    </>
  );
}

/* ─── Next event ───────────────────────────────────────────── */

function NextEventCard({
  insights,
  teamId,
}: {
  insights: Insights | null | undefined;
  teamId: string;
}) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[20px] h-[200px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights || !insights.nextEvent) {
    return (
      <div
        className="rounded-[20px] p-5 flex items-center gap-4"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--gray-100)" }}
      >
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-card)", color: "var(--text-tertiary)" }}
        >
          <CalendarIcon />
        </span>
        <div className="flex-1">
          <p
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Нет ближайших событий
          </p>
          <Link
            href={`/team/${teamId}/events`}
            className="text-[13px] font-semibold mt-1 inline-block"
            style={{ color: "var(--green-600)" }}
          >
            Создать событие →
          </Link>
        </div>
      </div>
    );
  }

  const e = insights.nextEvent;
  const cd = formatCountdown(e.date);
  const cdLabel = formatCountdownLabel(e.date);
  const countdownText = cdLabel ? `${cd} ${cdLabel}` : cd;
  const dateStr = new Date(e.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const timeStr = new Date(e.date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/team/${teamId}/events/${e.id}`}
      className="block rounded-[20px] overflow-hidden"
      style={{ background: "var(--gray-900)" }}
    >
      <div className="relative h-[120px] w-full">
        {e.venue?.photoUrl ? (
          <Image
            src={e.venue.photoUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--gray-700), var(--gray-900))",
            }}
          />
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, var(--gray-900) 100%)",
          }}
        />
        <div
          className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--green-500)" }}
          />
          {countdownText}
        </div>
      </div>
      <div className="px-4 pt-2 pb-4">
        <h2 className="font-display text-[22px] font-bold uppercase leading-none text-white">
          {EVENT_TYPE_LABEL[e.type] ?? e.type}
        </h2>
        <p
          className="text-[13px] mt-1.5 capitalize"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {dateStr} · {timeStr}
        </p>
        <div className="flex items-center gap-3 mt-3">
          {e.venue && (
            <span
              className="text-[12px] inline-flex items-center gap-1"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              <PinIcon />
              {e.venue.name}
            </span>
          )}
          <span
            className="text-[12px] inline-flex items-center gap-1.5 ml-auto"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <CheckIcon />
            <span className="font-semibold tabular-nums">
              {e.yesCount}
              {e.totalMembers > 0 ? ` / ${e.totalMembers}` : ""}
            </span>
          </span>
          {e.pricePerPlayer > 0 && (
            <span
              className="text-[12px] font-semibold tabular-nums"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {formatPrice(e.pricePerPlayer)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Activity 30d ─────────────────────────────────────────── */

function ActivityCard({ insights }: { insights: Insights | null | undefined }) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[16px] h-[140px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights) return null;
  const a = insights.activity;
  if (a.eventsCount === 0 && a.eventsCountPrev === 0) return null;

  const trend = a.eventsCount - a.eventsCountPrev;
  const maxCount = Math.max(1, ...a.eventsByWeek.map((w) => w.count));

  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <Eyebrow>Активность · 30 дней</Eyebrow>
          <p
            className="font-display text-[28px] font-bold leading-none mt-2 tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {a.eventsCount}
            <span
              className="text-[14px] font-normal ml-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {a.eventsCount === 1 ? "событие" : a.eventsCount < 5 ? "события" : "событий"}
            </span>
          </p>
          {a.eventsCountPrev > 0 && (
            <TrendChip delta={trend} unit="" />
          )}
        </div>
        {a.attendanceAvg > 0 && (
          <div className="text-right">
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
            >
              Явка
            </p>
            <p
              className="font-display text-[22px] font-bold leading-none mt-1 tabular-nums"
              style={{ color: "var(--green-600)" }}
            >
              {a.attendanceAvg}%
            </p>
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5 h-12">
        {a.eventsByWeek.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-[4px]"
              style={{
                height: `${Math.max(4, (w.count / maxCount) * 32)}px`,
                background: w.count > 0 ? "var(--green-500)" : "var(--gray-200)",
              }}
            />
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "var(--text-tertiary)" }}
            >
              {w.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Top players ──────────────────────────────────────────── */

function TopPlayersCard({ insights }: { insights: Insights | null | undefined }) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[16px] h-[120px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights || insights.topPlayers.length === 0) return null;

  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <Eyebrow>Лидеры · 30 дней</Eyebrow>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {insights.topPlayers.map((p, i) => (
          <Link
            key={p.id}
            href={`/players/${p.id}`}
            className="flex flex-col items-center text-center gap-2 rounded-[12px] p-2 transition-colors active:bg-bg-card"
          >
            <div className="relative">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--green-50)",
                    color: "var(--green-700)",
                  }}
                >
                  <span className="text-[16px] font-bold">
                    {initial(p.name)}
                  </span>
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  background:
                    i === 0
                      ? "var(--green-500)"
                      : i === 1
                        ? "var(--gray-400)"
                        : "var(--gray-300)",
                  color: "white",
                }}
              >
                {i + 1}
              </span>
            </div>
            <p
              className="text-[12px] font-semibold leading-tight truncate w-full"
              style={{ color: "var(--text-primary)" }}
            >
              {firstName(p.name)}
            </p>
            <p
              className="text-[11px] tabular-nums"
              style={{ color: "var(--text-tertiary)" }}
            >
              {p.played} матчей · {p.attendancePct}%
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Finance 30d (organizer) ──────────────────────────────── */

function FinanceCard({
  insights,
  teamId,
}: {
  insights: Insights | null | undefined;
  teamId: string;
}) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[16px] h-[110px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights || !insights.finance30d) return null;
  const f = insights.finance30d;
  const trend = f.netDelta - f.prevNetDelta;

  return (
    <Link
      href={`/team/${teamId}/finances`}
      className="block rounded-[16px] p-4 transition-colors active:bg-bg-card"
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--gray-100)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Финансы · 30 дней</Eyebrow>
          <p
            className="font-display text-[28px] font-bold leading-none mt-2 tabular-nums"
            style={{
              color:
                f.netDelta >= 0 ? "var(--green-600)" : "var(--danger)",
            }}
          >
            {f.netDelta >= 0 ? "+" : ""}
            {formatMoney(f.netDelta)}
          </p>
          {f.prevNetDelta !== 0 && <TrendChip delta={trend} unit="₸" />}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <p
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Сборы
            </p>
            <p
              className="text-[14px] font-semibold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {formatMoney(f.collected)}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Расходы
            </p>
            <p
              className="text-[14px] font-semibold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {formatMoney(f.venuePaid)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Guest join bar ───────────────────────────────────────── */

function GuestJoinBar({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  if (team.status !== "ready") return null;

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const {
    joinRequestStatus,
    joinRequestId,
    joinRequestCooldownUntil,
    reload,
  } = team;

  async function handleJoin() {
    if (!userId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!userId || !joinRequestId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/join-requests/${joinRequestId}?userId=${userId}`,
        { method: "DELETE" },
      );
      if (res.ok) reload();
    } finally {
      setBusy(false);
    }
  }

  if (joinRequestStatus === "pending") {
    return (
      <BottomActionBar>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled>
            Заявка отправлена
          </Button>
          <Button
            variant="secondary"
            loading={busy}
            disabled={busy}
            onClick={handleWithdraw}
          >
            Отозвать
          </Button>
        </div>
      </BottomActionBar>
    );
  }

  if (joinRequestStatus === "rejected") {
    const cooldown = joinRequestCooldownUntil
      ? Math.max(
          0,
          Math.ceil(
            (new Date(joinRequestCooldownUntil).getTime() - Date.now()) /
              86400000,
          ),
        )
      : 0;

    if (cooldown > 0) {
      return (
        <BottomActionBar>
          <Button variant="secondary" className="w-full" disabled>
            Можно подать снова через {cooldown}{" "}
            {cooldown === 1 ? "день" : cooldown < 5 ? "дня" : "дней"}
          </Button>
        </BottomActionBar>
      );
    }
    return (
      <BottomActionBar>
        <Button
          variant="primary"
          className="w-full"
          loading={busy}
          onClick={handleJoin}
        >
          Подать заявку снова
        </Button>
      </BottomActionBar>
    );
  }

  return (
    <BottomActionBar>
      <Button
        variant="primary"
        className="w-full"
        loading={busy}
        onClick={handleJoin}
      >
        Подать заявку
      </Button>
    </BottomActionBar>
  );
}

/* ─── Empty state ──────────────────────────────────────────── */

function EmptyTeamHome({
  teamId,
  canCreate,
}: {
  teamId: string;
  canCreate: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className="rounded-[20px] p-8 text-center flex flex-col items-center gap-3"
      style={{ background: "var(--bg-primary)" }}
    >
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "var(--green-50)", color: "var(--green-600)" }}
      >
        <CalendarIcon />
      </span>
      <p
        className="text-[16px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Команда только начинает
      </p>
      <p
        className="text-[13px]"
        style={{ color: "var(--text-secondary)" }}
      >
        {canCreate
          ? "Создай первое событие — соберите состав, играйте, ведите финансы."
          : "Подождите первого события или сами предложите организатору сыграть."}
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={() => router.push(`/team/${teamId}/events`)}
          className="mt-2 rounded-full px-5 py-2.5 text-[14px] font-semibold"
          style={{ background: "var(--green-500)", color: "white" }}
        >
          Создать первое событие
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────── */

function SkeletonHome() {
  return (
    <>
      <div
        className="rounded-[20px] h-[200px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
      <div
        className="rounded-[16px] h-[140px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
      <div
        className="rounded-[16px] h-[120px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    </>
  );
}

/* ─── Atoms ────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase"
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

function TrendChip({ delta, unit }: { delta: number; unit: string }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <p
      className="text-[12px] font-semibold mt-1.5 inline-flex items-center gap-0.5"
      style={{
        color: positive ? "var(--green-600)" : "var(--text-secondary)",
      }}
    >
      {positive ? "↑" : "↓"} {positive ? "+" : ""}
      {Math.abs(delta).toLocaleString("ru-RU")}
      {unit ? ` ${unit}` : ""}
    </p>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function requestsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} новая заявка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${n} новые заявки`;
  return `${n} новых заявок`;
}

/* ─── Icons ────────────────────────────────────────────────── */

function CalendarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
