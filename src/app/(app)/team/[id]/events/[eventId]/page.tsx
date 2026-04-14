"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getExpectedAmount,
  getPaidAmount,
  isAttendanceAttended,
  isAttendancePaid,
} from "@/lib/finances";
import { useTeam } from "../../team-context";

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

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
  created_by: string;
  venue: { id: string; name: string; address: string } | null;
};

type AttendanceItem = {
  id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  attended_confirmed: boolean | null;
  paid: boolean | null;
  paid_confirmed: boolean | null;
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

  if (loading) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Загружаю событие…
      </section>
    );
  }

  if (!event) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Событие не найдено
      </section>
    );
  }

  const yesVotes = attendances.filter((a) => a.vote === "yes");
  const noVotes = attendances.filter((a) => a.vote === "no");
  const myAttendance = userId ? attendances.find((a) => a.user_id === userId) : null;
  const myVote = myAttendance?.vote ?? null;

  return (
    <>
      {/* Event info card */}
      <section className="bg-background-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-display font-semibold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
            {TYPE_LABEL[event.type] ?? event.type}
          </span>
          <span className="text-xs font-display uppercase px-2 py-1 rounded bg-background text-foreground-secondary">
            {STATUS_LABEL[event.status] ?? event.status}
          </span>
        </div>

        <p className="text-2xl font-display font-bold mt-3">{formatDate(event.date)}</p>

        {event.venue && (
          <div className="mt-3">
            <p className="text-sm font-medium">{event.venue.name}</p>
            <p className="text-xs text-foreground-secondary">{event.venue.address}</p>
          </div>
        )}

        {event.description && (
          <p className="text-sm text-foreground-secondary mt-3">{event.description}</p>
        )}

        <div className="flex gap-6 mt-4 text-sm">
          {event.price_per_player > 0 && (
            <div>
              <p className="text-xs text-foreground-secondary">Цена</p>
              <p className="font-medium">{event.price_per_player} ₽</p>
            </div>
          )}
          <div>
            <p className="text-xs text-foreground-secondary">Мин. игроков</p>
            <p className="font-medium">{event.min_players}</p>
          </div>
        </div>
      </section>

      {/* Vote buttons for team members (planned only) */}
      {isMember && event.status === "planned" && userId && (
        <VoteButtons
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          currentVote={myVote}
          onVoted={loadEvent}
        />
      )}

      {/* Organizer: complete/cancel event */}
      {isOrganizer && event.status === "planned" && userId && (
        <EventStatusActions
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          onChanged={loadEvent}
        />
      )}

      {/* Self-mark attendance (completed events, for members) */}
      {isMember && event.status === "completed" && userId && (
        <SelfMarkSection
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          attendance={myAttendance ?? null}
          onChanged={loadEvent}
        />
      )}

      {/* Venue costs (organizer) */}
      {isOrganizer && userId && (
        <VenueCostsBlock
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          venueCost={event.venue_cost}
          venuePaid={event.venue_paid}
          onChanged={loadEvent}
        />
      )}

      {/* Finance summary (organizer, completed events with price) */}
      {isOrganizer && event.status === "completed" && event.price_per_player > 0 && (
        <FinanceSummary attendances={attendances} pricePerPlayer={event.price_per_player} />
      )}

      {/* Planned event — simple finance estimate for organizer */}
      {isOrganizer && event.status === "planned" && event.price_per_player > 0 && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary">Финансы</p>
          <p className="text-sm mt-1">
            Ожидаемый сбор: <span className="font-medium">{yesVotes.length * event.price_per_player} ₽</span>
            {" "}(из {event.min_players * event.price_per_player} ₽)
          </p>
        </section>
      )}

      {/* Attendees list */}
      {event.status === "completed" && isOrganizer ? (
        <OrganizerAttendanceList
          teamId={teamId}
          eventId={eventId}
          userId={userId!}
          attendances={attendances}
          pricePerPlayer={event.price_per_player}
          onChanged={loadEvent}
        />
      ) : (
        <SimpleAttendanceList attendances={attendances} yesVotes={yesVotes} noVotes={noVotes} />
      )}
    </>
  );
}

/* ─── Vote Buttons (planned) ─── */

function VoteButtons({
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

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleVote("yes")}
        disabled={sending}
        className={`flex-1 font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors disabled:opacity-50 ${
          currentVote === "yes"
            ? "bg-green-600 text-white"
            : "bg-background-card border border-border text-foreground"
        }`}
      >
        Приду
      </button>
      <button
        onClick={() => handleVote("no")}
        disabled={sending}
        className={`flex-1 font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors disabled:opacity-50 ${
          currentVote === "no"
            ? "bg-red-500 text-white"
            : "bg-background-card border border-border text-foreground"
        }`}
      >
        Не приду
      </button>
    </div>
  );
}

/* ─── Event Status Actions (organizer) ─── */

function EventStatusActions({
  teamId,
  eventId,
  userId,
  onChanged,
}: {
  teamId: string;
  eventId: string;
  userId: string;
  onChanged: () => void;
}) {
  const [sending, setSending] = useState(false);

  async function handleStatus(status: "completed" | "cancelled") {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) onChanged();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleStatus("completed")}
        disabled={sending}
        className="flex-1 bg-green-600 text-white font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors disabled:opacity-50"
      >
        Завершить
      </button>
      <button
        onClick={() => handleStatus("cancelled")}
        disabled={sending}
        className="flex-1 border border-border text-foreground-secondary font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors disabled:opacity-50"
      >
        Отменить
      </button>
    </div>
  );
}

/* ─── Self-mark (player marks attended/paid) ─── */

function SelfMarkSection({
  teamId,
  eventId,
  userId,
  attendance,
  onChanged,
}: {
  teamId: string;
  eventId: string;
  userId: string;
  attendance: AttendanceItem | null;
  onChanged: () => void;
}) {
  const [sending, setSending] = useState(false);

  async function toggle(field: "attended" | "paid") {
    if (sending) return;
    setSending(true);
    try {
      const currentValue = attendance?.[field] ?? false;
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, [field]: !currentValue }),
      });
      if (res.ok) onChanged();
    } finally {
      setSending(false);
    }
  }

  const attended = attendance?.attended ?? false;
  const paid = attendance?.paid ?? false;

  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Ваша отметка</p>
      <div className="flex gap-3">
        <button
          onClick={() => toggle("attended")}
          disabled={sending}
          className={`flex-1 font-display font-semibold uppercase rounded-full px-4 py-2.5 text-sm transition-colors disabled:opacity-50 ${
            attended
              ? "bg-green-600 text-white"
              : "border border-border text-foreground"
          }`}
        >
          {attended ? "Был(а)" : "Был(а)?"}
        </button>
        <button
          onClick={() => toggle("paid")}
          disabled={sending}
          className={`flex-1 font-display font-semibold uppercase rounded-full px-4 py-2.5 text-sm transition-colors disabled:opacity-50 ${
            paid
              ? "bg-green-600 text-white"
              : "border border-border text-foreground"
          }`}
        >
          {paid ? "Сдал(а)" : "Сдал(а)?"}
        </button>
      </div>
    </section>
  );
}

/* ─── Finance Summary (completed event) ─── */

function FinanceSummary({
  attendances,
  pricePerPlayer,
}: {
  attendances: AttendanceItem[];
  pricePerPlayer: number;
}) {
  const confirmedAttended = attendances.filter(isAttendanceAttended);
  const confirmedPaid = attendances.filter(isAttendancePaid);

  const expected = attendances.reduce((sum, a) => sum + getExpectedAmount(a, pricePerPlayer), 0);
  const actual = attendances.reduce((sum, a) => sum + getPaidAmount(a, pricePerPlayer), 0);
  const diff = actual - expected;

  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Финансы</p>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground-secondary">Были на событии</span>
          <span className="font-medium">{confirmedAttended.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-secondary">Ожидаемый сбор</span>
          <span className="font-medium">{expected} ₽</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-secondary">Сдали деньги</span>
          <span className="font-medium">{confirmedPaid.length} из {confirmedAttended.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-secondary">Фактический сбор</span>
          <span className="font-medium">{actual} ₽</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-border mt-1">
          <span className="text-foreground-secondary">Разница</span>
          <span className={`font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
            {diff >= 0 ? "+" : ""}{diff} ₽
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── Organizer Attendance List (with confirm toggles) ─── */

function OrganizerAttendanceList({
  teamId,
  eventId,
  userId,
  attendances,
  pricePerPlayer,
  onChanged,
}: {
  teamId: string;
  eventId: string;
  userId: string;
  attendances: AttendanceItem[];
  pricePerPlayer: number;
  onChanged: () => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [amountFor, setAmountFor] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");

  async function toggleConfirm(targetUserId: string, field: "attended_confirmed" | "paid_confirmed", mergedStatus: boolean | null) {
    if (processing) return;
    setProcessing(targetUserId + field);
    try {
      const newValue = !mergedStatus;
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId, [field]: newValue }),
      });
      if (res.ok) onChanged();
    } finally {
      setProcessing(null);
    }
  }

  async function saveAmount(targetUserId: string) {
    if (processing) return;
    const v = parseFloat(amountInput);
    if (!Number.isFinite(v) || v < 0) return;
    setProcessing(targetUserId + "amount");
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          targetUserId,
          paid_confirmed: true,
          paid_amount: v,
        }),
      });
      if (res.ok) {
        setAmountFor(null);
        setAmountInput("");
        onChanged();
      }
    } finally {
      setProcessing(null);
    }
  }

  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">
        Участники ({attendances.length})
      </p>
      {attendances.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-4 text-center text-foreground-secondary text-sm">
          Нет участников
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {attendances.map((a) => {
            const attendedStatus = a.attended_confirmed ?? a.attended;
            const paidStatus = a.paid_confirmed ?? a.paid;

            return (
              <li key={a.id} className="bg-background-card border border-border rounded-lg px-4 py-3">
                <p className="font-medium text-sm mb-2">{a.user.name}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleConfirm(a.user_id, "attended_confirmed", attendedStatus)}
                    disabled={processing !== null}
                    className={`text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                      attendedStatus === true
                        ? "bg-green-600 text-white"
                        : attendedStatus === false
                        ? "bg-red-500/10 text-red-500"
                        : "border border-border text-foreground-secondary"
                    }`}
                  >
                    {attendedStatus === true ? "Был" : attendedStatus === false ? "Не был" : "Был?"}
                  </button>
                  <button
                    onClick={() => toggleConfirm(a.user_id, "paid_confirmed", paidStatus)}
                    disabled={processing !== null}
                    className={`text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                      paidStatus === true
                        ? "bg-green-600 text-white"
                        : paidStatus === false
                        ? "bg-red-500/10 text-red-500"
                        : "border border-border text-foreground-secondary"
                    }`}
                  >
                    {paidStatus === true
                      ? a.paid_amount != null
                        ? `Сдал ${a.paid_amount} ₽`
                        : "Сдал"
                      : paidStatus === false
                      ? "Не сдал"
                      : "Сдал?"}
                  </button>
                  <button
                    onClick={() => {
                      setAmountFor(a.user_id);
                      setAmountInput(String(a.paid_amount ?? pricePerPlayer));
                    }}
                    disabled={processing !== null}
                    className="text-xs text-primary font-display font-semibold uppercase px-2 py-1.5"
                  >
                    Сумма
                  </button>
                </div>
                {amountFor === a.user_id && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Сумма ₽"
                      autoFocus
                    />
                    <button
                      onClick={() => saveAmount(a.user_id)}
                      disabled={processing !== null}
                      className="text-xs font-display font-semibold uppercase px-3 py-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      Ок
                    </button>
                    <button
                      onClick={() => {
                        setAmountFor(null);
                        setAmountInput("");
                      }}
                      className="text-xs text-foreground-secondary px-2"
                    >
                      ×
                    </button>
                  </div>
                )}
                {/* Show player's own marks if different from confirmed */}
                {(a.attended !== null || a.paid !== null) && (
                  <p className="text-xs text-foreground-secondary mt-1.5">
                    Отметка игрока:
                    {a.attended !== null && (a.attended ? " был" : " не был")}
                    {a.paid !== null && (a.paid ? ", сдал" : ", не сдал")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─── Simple Attendance List (non-organizer or planned) ─── */

function SimpleAttendanceList({
  attendances,
  yesVotes,
  noVotes,
}: {
  attendances: AttendanceItem[];
  yesVotes: AttendanceItem[];
  noVotes: AttendanceItem[];
}) {
  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">
        Голоса ({attendances.length})
      </p>

      {yesVotes.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-green-600 font-medium mb-1">Придут ({yesVotes.length})</p>
          <ul className="flex flex-col gap-1">
            {yesVotes.map((a) => (
              <li key={a.id} className="bg-background-card border border-border rounded-lg px-4 py-2 text-sm">
                {a.user.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {noVotes.length > 0 && (
        <div>
          <p className="text-xs text-red-500 font-medium mb-1">Не придут ({noVotes.length})</p>
          <ul className="flex flex-col gap-1">
            {noVotes.map((a) => (
              <li key={a.id} className="bg-background-card border border-border rounded-lg px-4 py-2 text-sm text-foreground-secondary">
                {a.user.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {attendances.length === 0 && (
        <div className="bg-background-card border border-border rounded-lg p-4 text-center text-foreground-secondary text-sm">
          Пока никто не проголосовал
        </div>
      )}
    </section>
  );
}

/* ─── Venue Costs Block (organizer only) ─── */

function VenueCostsBlock({
  teamId,
  eventId,
  userId,
  venueCost,
  venuePaid,
  onChanged,
}: {
  teamId: string;
  eventId: string;
  userId: string;
  venueCost: number;
  venuePaid: number;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [costInput, setCostInput] = useState(String(venueCost));
  const [paidInput, setPaidInput] = useState(String(venuePaid));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCostInput(String(venueCost));
    setPaidInput(String(venuePaid));
  }, [venueCost, venuePaid]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          venue_cost: parseFloat(costInput) || 0,
          venue_paid: parseFloat(paidInput) || 0,
        }),
      });
      if (res.ok) {
        setEditing(false);
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  }

  const remain = venueCost - venuePaid;

  if (!editing) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-5">
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-xs uppercase font-display text-foreground-secondary">Площадка — расходы</p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary font-display font-semibold uppercase"
          >
            Изменить
          </button>
        </div>
        {venueCost === 0 ? (
          <p className="text-sm text-foreground-secondary">Не указаны</p>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Стоимость</span>
              <span className="font-medium">{venueCost} ₽</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Оплачено</span>
              <span className="font-medium">{venuePaid} ₽</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-border mt-1">
              <span className="text-foreground-secondary">Остаток</span>
              <span className={`font-medium ${remain > 0 ? "text-red-500" : "text-green-600"}`}>
                {remain > 0 ? `${remain} ₽` : "оплачено"}
              </span>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-display text-foreground-secondary mb-3">
        Площадка — расходы
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Стоимость, ₽</label>
          <input
            type="number"
            min="0"
            value={costInput}
            onChange={(e) => setCostInput(e.target.value)}
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Оплачено, ₽</label>
          <input
            type="number"
            min="0"
            value={paidInput}
            onChange={(e) => setPaidInput(e.target.value)}
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Сохраняю…" : "Сохранить"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setCostInput(String(venueCost));
              setPaidInput(String(venuePaid));
            }}
            className="px-4 py-2 rounded-full border border-border text-foreground-secondary font-display font-semibold uppercase"
          >
            Отмена
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Helpers ─── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
