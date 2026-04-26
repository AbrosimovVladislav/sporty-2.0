"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import DistrictSelect from "@/components/DistrictSelect";
import { SkeletonList } from "@/components/Skeleton";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon } from "@/components/Icons";

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

const EVENT_TYPE_SHORT: Record<string, string> = {
  game: "ИГР",
  training: "ТРЕ",
  gathering: "СБО",
  other: "ЕВТ",
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
    return <SkeletonList count={3} />;
  }

  if (team.status !== "ready") return null;

  function handleCreated() {
    setShowForm(false);
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
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold">События</h2>
        {isOrganizer && !showForm && (
          <IconButton onClick={() => setShowForm(true)} aria-label="Создать событие">
            <PlusIcon />
          </IconButton>
        )}
      </div>

      {showForm && teamId && userId && (
        <CreateEventForm
          teamId={teamId}
          userId={userId}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {events === null ? (
        <SkeletonList count={2} />
      ) : events.length === 0 ? (
        <EmptyState text="Событий пока нет" />
      ) : (
        <>
          {planned.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionEyebrow>ПРЕДСТОЯЩИЕ</SectionEyebrow>
              <EventList items={planned} teamId={team.team.id} />
            </section>
          )}
          {past.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionEyebrow tone="muted">ПРОШЕДШИЕ</SectionEyebrow>
              <EventList items={past} teamId={team.team.id} />
            </section>
          )}
        </>
      )}
    </>
  );
}

function EventList({ items, teamId }: { items: EventItem[]; teamId: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((e) => (
        <li key={e.id}>
          <Link
            href={`/team/${teamId}/events/${e.id}`}
            className="flex gap-3 p-3 bg-background-card rounded-lg shadow-card"
          >
            {/* Gradient thumbnail */}
            <div className="w-20 h-20 shrink-0 rounded-md bg-linear-to-br from-foreground to-foreground-secondary flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase text-foreground-on-dark tracking-wider">
                {EVENT_TYPE_SHORT[e.type] ?? "ЕВТ"}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-semibold leading-tight">{formatListDate(e.date)}</p>
                <EventStatusPill status={e.status} />
              </div>
              {e.venue && (
                <p className="text-[13px] text-foreground-secondary truncate">{e.venue.name}</p>
              )}
              <p className="text-[13px] text-foreground-secondary tabular-nums">
                {e.yesCount} придут
                {e.min_players > 1 && ` · мин. ${e.min_players}`}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EventStatusPill({ status }: { status: string }) {
  if (status === "planned") return <Pill variant="statusMuted">Запланировано</Pill>;
  if (status === "completed") return <Pill variant="statusMuted">Завершено</Pill>;
  if (status === "cancelled") return <Pill variant="statusDanger">Отменено</Pill>;
  return null;
}

/* ─── Create Event Form ─── */

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
  const [venueDistrictId, setVenueDistrictId] = useState("");
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
              ? { name: venueName, address: venueAddress, city: "Алматы", district_id: venueDistrictId || null }
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
      className="bg-background-card rounded-lg shadow-card p-5 flex flex-col gap-4"
    >
      <p className="text-[17px] font-semibold">Новое событие</p>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] text-foreground-secondary">Тип</label>
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
          <label className="text-[13px] text-foreground-secondary">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[13px] text-foreground-secondary">Время</label>
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
          <label className="text-[13px] text-foreground-secondary">Цена с игрока, ₸</label>
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
          <label className="text-[13px] text-foreground-secondary">Мин. игроков</label>
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
        <label className="text-[13px] text-foreground-secondary">Площадка</label>
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
            <label className="text-[13px] text-foreground-secondary">Название</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Например, Лужники"
              className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] text-foreground-secondary">Адрес</label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="Адрес"
              className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] text-foreground-secondary">Район</label>
            <DistrictSelect
              city="Алматы"
              value={venueDistrictId}
              onChange={setVenueDistrictId}
              className="bg-background border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        </>
      )}

      {venueMode !== "none" && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] text-foreground-secondary">Стоимость площадки, ₸</label>
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
        <label className="text-[13px] text-foreground-secondary">Описание</label>
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
          <p className="text-[15px] font-medium">Публичное событие</p>
          <p className="text-[13px] text-foreground-secondary">Видно всем в поиске</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!date || !time}
          loading={sending}
          className="flex-1"
        >
          Создать
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}

function formatListDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
