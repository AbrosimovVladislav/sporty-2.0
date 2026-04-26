"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SkeletonCard } from "@/components/Skeleton";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { useTeam } from "../../team-context";
import { PhotoBanner } from "@/components/ui/PhotoBanner";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Button } from "@/components/ui/Button";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";

const STATUS_LABEL: Record<string, string> = {
  planned: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
};

type EventDetail = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  status: string;
  venue_cost: number;
  venue_paid: number;
  is_public: boolean;
  created_by: string;
  venue: { id: string; name: string; address: string } | null;
};

type AttendanceItem = {
  id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  paid_amount: number | null;
  user: { id: string; name: string };
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id: teamId, eventId } = use(params);
  const auth = useAuth();
  const team = useTeam();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";
  const isMember = team.status === "ready" && team.role !== "guest";

  const loadEvent = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/events/${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setEvent(data.event);
      setAttendances(data.attendances ?? []);
    }
    setLoading(false);
  }, [teamId, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function handleStatus(status: "completed" | "cancelled") {
    if (!userId) return;
    const setter = status === "completed" ? setCompleting : setCancelling;
    setter(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) loadEvent();
    } finally {
      setter(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-24" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-background-card rounded-lg shadow-card p-6 text-center text-foreground-secondary">
        Событие не найдено
      </div>
    );
  }

  const yesVotes = attendances.filter((a) => a.vote === "yes");
  const noVotes = attendances.filter((a) => a.vote === "no");
  const myAttendance = userId ? attendances.find((a) => a.user_id === userId) : null;
  const myVote = myAttendance?.vote ?? null;
  const showBottomBar = isOrganizer && event.status === "planned" && !!userId;

  const typePill = (
    <span className="bg-primary text-primary-foreground text-[12px] font-semibold uppercase tracking-wide rounded-full px-3 py-1">
      {EVENT_TYPE_LABEL[event.type] ?? event.type}
    </span>
  );
  const statusPillCls =
    event.status === "cancelled"
      ? "bg-danger-soft/90 text-danger"
      : event.status === "completed"
      ? "bg-white/80 text-foreground-secondary"
      : "bg-white/90 text-foreground";
  const statusPill = (
    <span className={`${statusPillCls} text-[12px] font-semibold uppercase tracking-wide rounded-full px-3 py-1`}>
      {STATUS_LABEL[event.status] ?? event.status}
    </span>
  );

  return (
    <div className={`flex flex-col gap-4 ${showBottomBar ? "pb-24" : ""}`}>
      {/* 1. Photo banner */}
      <PhotoBanner
        fallback="event"
        statusPills={[typePill, statusPill]}
        overlayContent={
          <div>
            <p className="text-[20px] font-semibold leading-tight">{formatBannerDate(event.date)}</p>
            {event.venue && (
              <p className="text-[14px] opacity-90 mt-1">{event.venue.name}</p>
            )}
          </div>
        }
      />

      {/* 2. Tripler metric */}
      <div className="bg-background-card rounded-lg shadow-card p-4 grid grid-cols-3 divide-x divide-border">
        <div className="flex flex-col items-center gap-0.5 pr-3">
          <span className="text-[18px] font-bold tabular-nums">
            {event.price_per_player > 0 ? `${event.price_per_player}₸` : "—"}
          </span>
          <span className="text-[11px] text-foreground-secondary">взнос</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-3">
          <span className="text-[18px] font-bold tabular-nums">{event.min_players}</span>
          <span className="text-[11px] text-foreground-secondary">мин. игроков</span>
        </div>
        <div className="flex flex-col items-center gap-1 pl-3">
          <span className="text-[18px] font-bold tabular-nums">
            {yesVotes.length}
            <span className="text-[13px] font-normal text-foreground-secondary">
              /{event.min_players}
            </span>
          </span>
          <div className="w-full h-1.5 bg-background-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(100, (yesVotes.length / event.min_players) * 100)}%`,
              }}
            />
          </div>
          <span className="text-[11px] text-foreground-secondary">участников</span>
        </div>
      </div>

      {/* 3. Vote card (planned) */}
      {(isMember || event.is_public) && event.status === "planned" && userId && (
        <VoteCard
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          currentVote={myVote}
          onVoted={loadEvent}
        />
      )}

      {/* 4–5. Придут / Не придут (planned & cancelled) */}
      {event.status !== "completed" && (
        <>
          {yesVotes.length > 0 && (
            <AttendeeGroup
              label={`ПРИДУТ (${yesVotes.length})`}
              tone="primary"
              users={yesVotes.map((a) => ({ id: a.user_id, name: a.user.name }))}
              grayscale={false}
            />
          )}
          {noVotes.length > 0 && (
            <AttendeeGroup
              label={`НЕ ПРИДУТ (${noVotes.length})`}
              tone="muted"
              users={noVotes.map((a) => ({ id: a.user_id, name: a.user.name }))}
              grayscale={true}
            />
          )}
          {attendances.length === 0 && (
            <div className="bg-background-card rounded-lg shadow-card p-4 text-center text-[13px] text-foreground-secondary">
              Пока никто не проголосовал
            </div>
          )}
        </>
      )}

      {/* 6. Participants (completed) */}
      {event.status === "completed" && (
        <ParticipantsList
          teamId={teamId}
          eventId={eventId}
          attendances={attendances}
          userId={userId ?? ""}
          isOrganizer={isOrganizer}
          onChanged={loadEvent}
        />
      )}

      {/* 7. Management card (organizer) */}
      {isOrganizer && userId && (
        <ManagementCard
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          event={event}
          yesVotes={yesVotes}
          attendances={attendances}
          onChanged={loadEvent}
        />
      )}

      {/* 8. Bottom action bar (organizer + planned) */}
      {showBottomBar && (
        <BottomActionBar>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              loading={completing}
              disabled={completing || cancelling}
              onClick={() => handleStatus("completed")}
            >
              Завершить
            </Button>
            <Button
              variant="secondary"
              loading={cancelling}
              disabled={completing || cancelling}
              onClick={() => handleStatus("cancelled")}
            >
              Отменить
            </Button>
          </div>
        </BottomActionBar>
      )}
    </div>
  );
}

/* ─── Vote Card ─── */

function VoteCard({
  teamId,
  eventId,
  userId,
  currentVote,
  onVoted,
}: {
  teamId: string;
  eventId: string;
  userId: string;
  currentVote: "yes" | "no" | null;
  onVoted: () => void;
}) {
  const [sending, setSending] = useState(false);

  async function handleVote(vote: "yes" | "no") {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, vote }),
      });
      if (res.ok) onVoted();
    } finally {
      setSending(false);
    }
  }

  const statusText =
    currentVote === "yes"
      ? "Вы идёте"
      : currentVote === "no"
      ? "Вы не идёте"
      : "Вы ещё не ответили";

  return (
    <section className="bg-background-card rounded-lg shadow-card p-4">
      <p className="text-[13px] font-semibold text-foreground-secondary mb-3">Ваш ответ</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={currentVote === "yes" ? "primary" : "secondary"}
          disabled={sending}
          loading={sending && currentVote !== "yes"}
          onClick={() => handleVote("yes")}
        >
          Приду
        </Button>
        <Button
          variant={currentVote === "no" ? "danger" : "secondary"}
          disabled={sending}
          loading={sending && currentVote !== "no"}
          onClick={() => handleVote("no")}
        >
          Не приду
        </Button>
      </div>
      <p className="text-[13px] text-foreground-secondary text-center mt-2">{statusText}</p>
    </section>
  );
}

/* ─── Attendee Group (Придут / Не придут) ─── */

function AttendeeGroup({
  label,
  tone,
  users,
  grayscale,
}: {
  label: string;
  tone: "primary" | "muted";
  users: { id: string; name: string }[];
  grayscale: boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="flex flex-col gap-2">
      <SectionEyebrow tone={tone}>{label}</SectionEyebrow>
      <div className={grayscale ? "grayscale opacity-70" : ""}>
        <AvatarStack users={users} max={4} size="sm" />
      </div>
      {users.length > 4 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-primary text-[13px] font-semibold self-start"
        >
          Показать всех
        </button>
      )}
      {showAll && (
        <ul className="flex flex-col gap-1 mt-1">
          {users.map((u) => (
            <li key={u.id} className="text-[13px] text-foreground-secondary">
              {u.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─── Participants List (completed events) ─── */

function ParticipantsList({
  teamId,
  eventId,
  attendances,
  userId,
  isOrganizer,
  onChanged,
}: {
  teamId: string;
  eventId: string;
  attendances: AttendanceItem[];
  userId: string;
  isOrganizer: boolean;
  onChanged: () => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);

  async function toggleField(
    targetUserId: string,
    field: "attended" | "paid",
    current: boolean | null
  ) {
    if (processing) return;
    setProcessing(targetUserId + field);
    try {
      const body = isOrganizer
        ? { userId, targetUserId, [field]: !current }
        : { userId, [field]: !current };
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onChanged();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionEyebrow>УЧАСТНИКИ ({attendances.length})</SectionEyebrow>
      {attendances.length === 0 ? (
        <div className="bg-background-card rounded-lg shadow-card p-4 text-center text-[13px] text-foreground-secondary">
          Нет участников
        </div>
      ) : (
        <ul className="bg-background-card rounded-lg shadow-card divide-y divide-border">
          {attendances.map((a) => {
            const canInteract = isOrganizer || a.user_id === userId;
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={a.user.name} size="sm" />
                <p className="flex-1 text-[15px] font-semibold truncate">{a.user.name}</p>
                <div className="flex gap-2 shrink-0">
                  {canInteract ? (
                    <button
                      onClick={() => toggleField(a.user_id, "attended", a.attended ?? null)}
                      disabled={processing !== null}
                      className={`text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                        a.attended === true
                          ? "bg-primary text-primary-foreground"
                          : "bg-background-muted text-foreground-secondary"
                      }`}
                    >
                      {a.attended === true ? "Был" : "Был?"}
                    </button>
                  ) : (
                    a.attended !== null && (
                      <span
                        className={`text-[12px] px-2.5 py-1 rounded-full ${
                          a.attended
                            ? "bg-primary-soft text-primary"
                            : "bg-background-muted text-foreground-secondary"
                        }`}
                      >
                        {a.attended ? "Был" : "Не был"}
                      </span>
                    )
                  )}
                  {canInteract ? (
                    <button
                      onClick={() => toggleField(a.user_id, "paid", a.paid ?? null)}
                      disabled={processing !== null}
                      className={`text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                        a.paid === true
                          ? "bg-primary text-primary-foreground"
                          : "bg-background-muted text-foreground-secondary"
                      }`}
                    >
                      {a.paid === true ? "Сдал" : "Сдал?"}
                    </button>
                  ) : (
                    a.paid !== null && (
                      <span
                        className={`text-[12px] px-2.5 py-1 rounded-full ${
                          a.paid
                            ? "bg-primary-soft text-primary"
                            : "bg-background-muted text-foreground-secondary"
                        }`}
                      >
                        {a.paid ? "Сдал" : "Не сдал"}
                      </span>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─── Management Card (organizer) ─── */

function ManagementCard({
  teamId,
  eventId,
  userId,
  event,
  yesVotes,
  attendances,
  onChanged,
}: {
  teamId: string;
  eventId: string;
  userId: string;
  event: EventDetail;
  yesVotes: AttendanceItem[];
  attendances: AttendanceItem[];
  onChanged: () => void;
}) {
  const [editingVenue, setEditingVenue] = useState(false);
  const [costInput, setCostInput] = useState(String(event.venue_cost));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCostInput(String(event.venue_cost));
  }, [event.venue_cost]);

  async function patch(body: Record<string, unknown>) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...body }),
      });
      if (res.ok) {
        setEditingVenue(false);
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  }

  const venuePaid = event.venue_cost > 0 && event.venue_paid >= event.venue_cost;

  // Finance summary for completed events
  const expectedCollected =
    attendances.filter((a) => a.attended === true).length * event.price_per_player;
  const actualCollected = attendances.reduce(
    (sum, a) => sum + (a.paid ? (a.paid_amount ?? event.price_per_player) : 0),
    0
  );

  return (
    <section className="bg-background-card rounded-lg shadow-card overflow-hidden">
      <h3 className="px-4 pt-4 pb-2 text-[11px] uppercase tracking-wide font-semibold text-foreground-secondary">
        Управление
      </h3>
      <ul className="divide-y divide-border">
        {/* Venue cost row */}
        {editingVenue ? (
          <li className="px-4 py-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] text-foreground-secondary">Стоимость площадки, ₸</label>
              <input
                type="number"
                min="0"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                autoFocus
                className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                loading={saving}
                onClick={() => patch({ venue_cost: parseFloat(costInput) || 0 })}
                className="flex-1"
              >
                Сохранить
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingVenue(false);
                  setCostInput(String(event.venue_cost));
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </li>
        ) : (
          <li className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium">Площадка</p>
              <p className="text-[13px] text-foreground-secondary">
                {event.venue_cost === 0
                  ? "Стоимость не указана"
                  : `${event.venue_cost} ₸ · ${venuePaid ? "оплачено" : `оплачено ${event.venue_paid}`}`}
              </p>
            </div>
            <button
              onClick={() => setEditingVenue(true)}
              className="text-[13px] text-primary font-semibold shrink-0"
            >
              {event.venue_cost === 0 ? "Указать" : "Изменить"}
            </button>
          </li>
        )}

        {/* Venue paid toggle */}
        {event.venue_cost > 0 && !editingVenue && (
          <li className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium">Оплата площадки</p>
              <p className="text-[13px] text-foreground-secondary">
                {venuePaid
                  ? "Оплачено полностью"
                  : event.venue_paid > 0
                  ? `Оплачено ${event.venue_paid} из ${event.venue_cost} ₸`
                  : "Не оплачено"}
              </p>
            </div>
            <button
              onClick={() => patch({ venue_paid: venuePaid ? 0 : event.venue_cost })}
              disabled={saving}
              className={`text-[13px] font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 shrink-0 ${
                venuePaid
                  ? "bg-primary-soft text-primary"
                  : "bg-background-muted text-foreground-secondary"
              }`}
            >
              {venuePaid ? "Оплачено" : "Отметить"}
            </button>
          </li>
        )}

        {/* Finance row */}
        {event.price_per_player > 0 && (
          <li className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium">Финансы</p>
              <p className="text-[13px] text-foreground-secondary">
                {event.status === "planned"
                  ? `Ожидаемый сбор: ${yesVotes.length * event.price_per_player} ₸`
                  : `Собрано: ${actualCollected} из ${expectedCollected} ₸`}
              </p>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}

/* ─── Helpers ─── */

function formatBannerDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
