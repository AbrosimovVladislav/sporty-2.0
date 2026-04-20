"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

type EventItem = {
  id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  status: string;
  venue_cost: number;
  venue_paid: number;
  venue: { id: string; name: string; address: string } | null;
  yesCount: number;
  noCount: number;
  myVote: "yes" | "no" | null;
  expectedCollected: number;
  actualCollected: number;
};

export default function EventsPage() {
  const team = useTeam();
  const auth = useAuth();

  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/events${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setEvents(d.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, userId]);

  if (team.status === "loading") {
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Загружаю события…
      </section>
    );
  }

  if (team.status !== "ready") return null;

  function handleCreated() {
    setShowForm(false);
    // Re-fetch events
    if (!teamId) return;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/events${params}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }

  const planned = (events ?? []).filter((e) => e.status === "planned");
  const past = (events ?? []).filter((e) => e.status !== "planned");

  return (
    <>
      {isOrganizer && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors hover:bg-primary-hover"
        >
          Создать событие
        </button>
      )}

      {showForm && teamId && userId && (
        <CreateEventForm
          teamId={teamId}
          userId={userId}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {events === null ? (
        <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </section>
      ) : events.length === 0 ? (
        <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Событий пока нет
        </section>
      ) : (
        <>
          {planned.length > 0 && (
            <EventGroup title="Предстоящие" items={planned} teamId={team.team.id} isOrganizer={isOrganizer} />
          )}
          {past.length > 0 && (
            <EventGroup title="Прошедшие" items={past} teamId={team.team.id} isOrganizer={isOrganizer} />
          )}
        </>
      )}
    </>
  );
}

function EventGroup({
  title,
  items,
  teamId,
  isOrganizer,
}: {
  title: string;
  items: EventItem[];
  teamId: string;
  isOrganizer: boolean;
}) {
  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">{title}</p>
      <ul className="flex flex-col gap-3">
        {items.map((e) => (
          <li key={e.id}>
            <Link
              href={`/team/${teamId}/events/${e.id}`}
              className="block bg-background-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-semibold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                  {TYPE_LABEL[e.type] ?? e.type}
                </span>
                <span className="text-xs text-foreground-secondary">
                  {formatDate(e.date)}
                </span>
              </div>

              {e.venue && (
                <p className="text-sm text-foreground-secondary mt-2">{e.venue.name}</p>
              )}

              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-green-600">✓ {e.yesCount}</span>
                <span className="text-red-500">✗ {e.noCount}</span>
                {e.min_players > 1 && (
                  <span className="text-foreground-secondary">мин. {e.min_players}</span>
                )}
              </div>

              {isOrganizer && e.price_per_player > 0 && (
                <p className="text-xs text-foreground-secondary mt-2">
                  {e.status === "completed"
                    ? `Сбор: ${e.actualCollected} из ${e.expectedCollected} ₽`
                    : `Ожидаемый сбор: ${e.yesCount * e.price_per_player} ₽`}
                </p>
              )}

              {isOrganizer && e.venue_cost > 0 && (
                <p className="text-xs text-foreground-secondary mt-1">
                  Площадка: {e.venue_cost} ₽
                  {e.venue_paid > 0 && ` (оплачено ${e.venue_paid})`}
                </p>
              )}

              {e.myVote && (
                <p className="text-xs mt-2">
                  {e.myVote === "yes" ? (
                    <span className="text-green-600">Вы: приду</span>
                  ) : (
                    <span className="text-red-500">Вы: не приду</span>
                  )}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type VenueOption = { id: string; name: string; address: string; city: string | null };

function CreateEventForm({
  teamId,
  userId,
  onCreated,
  onCancel,
}: {
  teamId: string;
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState("game");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [description, setDescription] = useState("");
  const [venueMode, setVenueMode] = useState<"none" | "existing" | "new">("none");
  const [venueOptions, setVenueOptions] = useState<VenueOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCost, setVenueCost] = useState("");
  const [sending, setSending] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data) => setVenueOptions(data.venues ?? []))
      .catch(() => setVenueOptions([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || sending) return;
    setSending(true);

    const datetime = `${date}T${time}:00`;

    try {
      const res = await fetch(`/api/teams/${teamId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          date: datetime,
          price_per_player: price ? parseFloat(price) : 0,
          min_players: minPlayers ? parseInt(minPlayers, 10) : 1,
          description: description || null,
          venue_id: venueMode === "existing" && selectedVenueId ? selectedVenueId : undefined,
          venue:
            venueMode === "new" && venueName && venueAddress
              ? { name: venueName, address: venueAddress }
              : undefined,
          venue_cost: venueCost ? parseFloat(venueCost) : 0,
          is_public: isPublic,
        }),
      });
      if (res.ok) onCreated();
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background-card border border-border rounded-lg p-5 flex flex-col gap-4"
    >
      <p className="text-xs uppercase font-display text-foreground-secondary">Новое событие</p>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Тип</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        >
          <option value="game">Игра</option>
          <option value="training">Тренировка</option>
          <option value="gathering">Сбор</option>
          <option value="other">Другое</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Время</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Цена с игрока, ₽</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            placeholder="0"
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Мин. игроков</label>
          <input
            type="number"
            value={minPlayers}
            onChange={(e) => setMinPlayers(e.target.value)}
            min="1"
            placeholder="1"
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Площадка</label>
        <select
          value={venueMode === "existing" ? selectedVenueId : venueMode}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "none") {
              setVenueMode("none");
              setSelectedVenueId("");
            } else if (v === "__new__") {
              setVenueMode("new");
              setSelectedVenueId("");
            } else {
              setVenueMode("existing");
              setSelectedVenueId(v);
            }
          }}
          className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        >
          <option value="none">Не указана</option>
          {venueOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.address}
            </option>
          ))}
          <option value="__new__">+ Новая площадка</option>
        </select>
      </div>

      {venueMode === "new" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-foreground-secondary">Название</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Например, Лужники"
              className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-foreground-secondary">Адрес</label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="Адрес"
              className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        </>
      )}

      {venueMode !== "none" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Стоимость площадки, ₽</label>
          <input
            type="number"
            value={venueCost}
            onChange={(e) => setVenueCost(e.target.value)}
            min="0"
            placeholder="0"
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Необязательно"
          className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isPublic ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPublic ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium">Публичное событие</p>
          <p className="text-xs text-foreground-secondary">Видно всем в поиске</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={sending || !date || !time}
          className="flex-1 bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {sending ? "Создаю…" : "Создать"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-full border border-border text-foreground-secondary font-display font-semibold uppercase"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
