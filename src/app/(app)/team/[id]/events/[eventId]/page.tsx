"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
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
  created_by: string;
  venue: { id: string; name: string; address: string } | null;
};

type AttendanceItem = {
  id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
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

      {/* Vote buttons for team members */}
      {isMember && event.status === "planned" && userId && (
        <VoteButtons
          teamId={teamId}
          eventId={eventId}
          userId={userId}
          currentVote={myVote}
          onVoted={loadEvent}
        />
      )}

      {/* Organizer finance summary */}
      {isOrganizer && event.price_per_player > 0 && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary">Финансы</p>
          <p className="text-sm mt-1">
            Ожидаемый сбор: <span className="font-medium">{yesVotes.length * event.price_per_player} ₽</span>
            {" "}(из {event.min_players * event.price_per_player} ₽)
          </p>
        </section>
      )}

      {/* Attendees list */}
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
    </>
  );
}

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
