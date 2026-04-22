"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "./team-context";
import { Skeleton } from "@/components/Skeleton";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";

export default function TeamHomePage() {
  const team = useTeam();

  if (team.status === "loading") {
    return <SkeletonBlock />;
  }

  if (team.status === "not_found" || team.status === "error") {
    return null;
  }

  const { members, role, pendingRequestsCount, teamStats } = team;
  const playersCount = members.filter((m) => m.role === "player").length;
  const organizersCount = members.filter((m) => m.role === "organizer").length;

  return (
    <>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Состав</p>
        <p className="text-2xl font-display font-bold mt-1">
          {playersLabel(playersCount)}
        </p>
        {organizersCount > 0 && (
          <p className="text-sm text-foreground-secondary mt-1">
            + {organizersLabel(organizersCount)}
          </p>
        )}
      </section>

      <NextEventBlock teamId={team.team.id} />

      {(teamStats.completedEvents > 0 || teamStats.plannedEvents > 0) && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary">Статистика</p>
          <div className="flex gap-6 mt-2">
            <div>
              <p className="text-2xl font-display font-bold">{teamStats.completedEvents}</p>
              <p className="text-xs text-foreground-secondary">проведено</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{teamStats.plannedEvents}</p>
              <p className="text-xs text-foreground-secondary">запланировано</p>
            </div>
          </div>
        </section>
      )}

      {role === "organizer" && (
        <>
          <FinanceBalanceBlock teamId={team.team.id} />

          <LookingForPlayersToggle
            teamId={team.team.id}
            initial={team.team.looking_for_players}
          />

          <IncomingRequestsBlock
            teamId={team.team.id}
            count={pendingRequestsCount}
            onChanged={team.reload}
          />
        </>
      )}

      {role === "guest" && <JoinRequestButton teamId={team.team.id} />}
    </>
  );
}

function JoinRequestButton({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [sending, setSending] = useState(false);

  if (team.status !== "ready") return null;

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { joinRequestStatus, reload } = team;

  if (joinRequestStatus === "pending") {
    return (
      <div className="w-full bg-background-card border border-border text-foreground-secondary font-display font-semibold uppercase rounded-full px-6 py-3 text-center">
        Заявка отправлена
      </div>
    );
  }

  if (joinRequestStatus === "rejected") {
    return (
      <div className="w-full bg-background-card border border-border text-foreground-secondary font-display font-semibold uppercase rounded-full px-6 py-3 text-center">
        Заявка отклонена
      </div>
    );
  }

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

  return (
    <button
      onClick={handleJoin}
      disabled={sending || !userId}
      className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {sending ? "Отправляю…" : "Подать заявку"}
    </button>
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
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">
          Входящие заявки
        </p>
        {count === 0 ? (
          <p className="text-sm text-foreground-secondary mt-1">Новых заявок нет</p>
        ) : (
          <button
            onClick={loadRequests}
            className="text-primary font-display font-semibold text-sm mt-1 underline underline-offset-4"
          >
            {requestsLabel(count)} — посмотреть
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-display text-foreground-secondary mb-3">
        Входящие заявки
      </p>
      {requests === null ? (
        <Skeleton className="h-10" />
      ) : requests.length === 0 ? (
        <p className="text-sm text-foreground-secondary">Новых заявок нет</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="border border-border rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.user.name}</p>
                  {r.user.city && (
                    <p className="text-xs text-foreground-secondary">{r.user.city}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, "accept")}
                    disabled={processing === r.id}
                    className="text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={processing === r.id}
                    className="text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full border border-border text-foreground-secondary disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
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
      .then((d) => {
        if (cancelled) return;
        setEvent(d.event ?? null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, userId]);

  if (event === undefined) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <Skeleton className="h-6 w-40 mt-2" />
      </section>
    );
  }

  if (event === null) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <p className="text-sm text-foreground-secondary mt-1">Событий пока нет</p>
      </section>
    );
  }

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Link href={`/team/${teamId}/events/${event.id}`}>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Ближайшее событие</p>
        <p className="text-lg font-display font-bold mt-1">
          {EVENT_TYPE_LABEL[event.type] ?? event.type} — {dateStr}
        </p>
        {event.venue && (
          <p className="text-sm text-foreground-secondary mt-1">{event.venue.name}</p>
        )}
        <p className="text-sm text-foreground-secondary mt-1">
          Придут: {event.yesCount}
        </p>
      </section>
    </Link>
  );
}

function FinanceBalanceBlock({ teamId }: { teamId: string }) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const [data, setData] = useState<{
    realBalance: number;
    playersDebt: number;
    venueOutstanding: number;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/teams/${teamId}/finances?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setData({
          realBalance: d.metrics.realBalance,
          playersDebt: d.metrics.playersDebt,
          venueOutstanding: d.metrics.venueOutstanding,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [teamId, userId]);

  return (
    <Link href={`/team/${teamId}/finances`}>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">
          Финансовый баланс
        </p>
        {data === null ? (
          <Skeleton className="h-7 w-24 mt-2" />
        ) : (
          <>
            <p
              className={`text-2xl font-display font-bold mt-1 ${
                data.realBalance >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {data.realBalance >= 0 ? "+" : ""}
              {data.realBalance} ₸
            </p>
            {(data.playersDebt > 0 || data.venueOutstanding > 0) && (
              <p className="text-xs text-foreground-secondary mt-1">
                {data.playersDebt > 0 && `Долги игроков: ${data.playersDebt} ₸`}
                {data.playersDebt > 0 && data.venueOutstanding > 0 && " · "}
                {data.venueOutstanding > 0 && `К оплате площадкам: ${data.venueOutstanding} ₸`}
              </p>
            )}
          </>
        )}
      </section>
    </Link>
  );
}

function LookingForPlayersToggle({ teamId, initial }: { teamId: string; initial: boolean }) {
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
    <section className="bg-background-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-display text-foreground-secondary">Набор игроков</p>
          <p className="text-sm mt-1">{enabled ? "Открыт" : "Закрыт"}</p>
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
    </section>
  );
}

function SkeletonBlock() {
  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32 mt-2" />
    </section>
  );
}

function playersLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} игрок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игрока`;
  return `${n} игроков`;
}

function organizersLabel(n: number): string {
  return n === 1 ? `${n} организатор` : `${n} организатора`;
}

function requestsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} заявка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} заявки`;
  return `${n} заявок`;
}
