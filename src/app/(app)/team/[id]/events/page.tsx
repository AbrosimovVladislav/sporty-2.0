"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { FilterPills } from "@/components/ui/FilterPills";
import { SheetChipGroup } from "@/components/ui/SheetChipGroup";
import { Button } from "@/components/ui/Button";
import { EventListRow } from "@/components/events/EventListRow";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import DistrictSelect from "@/components/DistrictSelect";
import { KZ_CITIES } from "@/lib/city-context";

// ─── types ────────────────────────────────────────────────────────────────────

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

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_PILLS = [
  { value: "", label: "Все" },
  { value: "game", label: "Игра" },
  { value: "training", label: "Трен." },
  { value: "gathering", label: "Сбор" },
  { value: "other", label: "Другое" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "game", label: "Игра" },
  { value: "training", label: "Тренировка" },
  { value: "gathering", label: "Сбор" },
  { value: "other", label: "Другое" },
];

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const team = useTeam();
  const auth = useAuth();

  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const teamName = team.status === "ready" ? team.team.name : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";

  const loadEvents = () => {
    if (!teamId) return;
    const params = userId ? `?userId=${userId}` : "";
    fetch(`/api/teams/${teamId}/events${params}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]));
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, userId]);

  if (team.status === "loading" || events === null) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5 mb-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-9 flex-1 rounded-[10px] animate-pulse" style={{ background: "var(--gray-100)" }} />
          ))}
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: "var(--gray-100)" }}>
            <div className="w-11 h-11 rounded-[12px] animate-pulse shrink-0" style={{ background: "var(--gray-100)" }} />
            <div className="flex-1">
              <div className="h-4 w-28 rounded animate-pulse mb-1.5" style={{ background: "var(--gray-100)" }} />
              <div className="h-3 w-40 rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (team.status !== "ready") return null;

  const filtered = typeFilter
    ? events.filter((e) => e.type === typeFilter)
    : events;

  const planned = filtered
    .filter((e) => e.status === "planned")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = filtered
    .filter((e) => e.status !== "planned")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className="mb-4">
        <FilterPills options={TYPE_PILLS} value={typeFilter} onChange={setTypeFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-10">
          <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>
            {typeFilter ? "Нет событий этого типа" : "Событий пока нет"}
          </p>
        </div>
      ) : (
        <>
          {planned.length > 0 && (
            <section className="mb-5">
              <Eyebrow>ПРЕДСТОЯЩИЕ · {planned.length}</Eyebrow>
              <ul>
                {planned.map((e) => (
                  <li key={e.id}>
                    <EventListRow
                      id={e.id}
                      teamId={teamId!}
                      teamName={teamName}
                      title={EVENT_TYPE_LABEL[e.type] ?? e.type}
                      type={e.type}
                      date={e.date}
                      venueName={e.venue?.name ?? null}
                      venueDistrict={null}
                      venueCity={null}
                      yesCount={e.yesCount}
                      pricePerPlayer={e.price_per_player}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section className="mb-5">
              <Eyebrow muted>ПРОШЕДШИЕ · {past.length}</Eyebrow>
              <ul>
                {past.map((e) => (
                  <li key={e.id}>
                    <EventListRow
                      id={e.id}
                      teamId={teamId!}
                      teamName={teamName}
                      title={EVENT_TYPE_LABEL[e.type] ?? e.type}
                      type={e.type}
                      date={e.date}
                      venueName={e.venue?.name ?? null}
                      venueDistrict={null}
                      venueCity={null}
                      yesCount={e.yesCount}
                      pricePerPlayer={e.price_per_player}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {isOrganizer && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Создать событие"
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 transition-transform active:scale-95"
          style={{ background: "var(--green-500)", color: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
        >
          <PlusIcon />
        </button>
      )}

      {showCreate && teamId && userId && team.status === "ready" && (
        <EventCreateSheet
          teamId={teamId}
          userId={userId}
          teamCity={team.team.city}
          onCreated={() => {
            setShowCreate(false);
            loadEvents();
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}

// ─── Eyebrow ──────────────────────────────────────────────────────────────────

function Eyebrow({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p
      className="text-[11px] font-bold uppercase mb-3 px-0.5"
      style={{
        letterSpacing: "0.06em",
        color: muted ? "var(--text-tertiary)" : "var(--text-secondary)",
      }}
    >
      {children}
    </p>
  );
}

// ─── EventCreateSheet ─────────────────────────────────────────────────────────

type VenueOption = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  default_cost: number | null;
};

function EventCreateSheet({
  teamId,
  userId,
  teamCity,
  onCreated,
  onClose,
}: {
  teamId: string;
  userId: string;
  teamCity: string;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [eventType, setEventType] = useState("game");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(teamCity);
  const [venueMode, setVenueMode] = useState<"none" | "existing" | "new">("none");
  const [venueOptions, setVenueOptions] = useState<VenueOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueDistrictId, setVenueDistrictId] = useState("");
  const [venueCost, setVenueCost] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!city) {
      setVenueOptions([]);
      return;
    }
    fetch(`/api/venues?city=${encodeURIComponent(city)}&limit=100`)
      .then((r) => r.json())
      .then((data) => setVenueOptions(data.venues ?? []))
      .catch(() => setVenueOptions([]));
  }, [city]);

  // Reset venue/district selections when city changes — they belong to a specific city
  useEffect(() => {
    setSelectedVenueId("");
    setVenueDistrictId("");
    if (venueMode === "existing") setVenueMode("none");
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: eventType,
          date: `${date}T${time}:00`,
          price_per_player: price ? parseFloat(price) : 0,
          min_players: minPlayers ? parseInt(minPlayers, 10) : 1,
          description: description || null,
          venue_id: venueMode === "existing" && selectedVenueId ? selectedVenueId : undefined,
          venue:
            venueMode === "new" && venueName && venueAddress
              ? { name: venueName, address: venueAddress, city, district_id: venueDistrictId || null }
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

  // Fixed-height inputs — every form row is 46px tall, full width, native pickers
  // get `appearance: none` so iOS/Android don't shrink them to fit content.
  const inputClass = "block w-full h-[46px] px-4 rounded-[12px] text-[14px] outline-none transition-colors focus:border-green-500";
  const inputStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1.5px solid var(--gray-200)",
    WebkitAppearance: "none",
    appearance: "none",
    minWidth: 0,
  };
  const labelClass = "text-[12px] font-semibold uppercase mb-1.5 block";
  const labelStyle = { color: "var(--text-tertiary)", letterSpacing: "0.06em" };

  const cityOptions = KZ_CITIES.map((c) => ({ value: c, label: c }));
  const venueSelectValue = venueMode === "existing" ? selectedVenueId : venueMode;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white flex flex-col"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
          maxHeight: "92dvh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <span className="block w-9 h-1 rounded-full" style={{ background: "var(--gray-300)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
          <h2 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>
            Новое событие
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col min-h-0 flex-1"
        >
          <div className="overflow-y-auto px-4 pt-1 pb-5 flex flex-col gap-4">
            {/* Type */}
            <SheetChipGroup
              label="Тип события"
              options={EVENT_TYPE_OPTIONS}
              value={eventType}
              onChange={setEventType}
              emptyLabel={null}
            />

            {/* Date & time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={labelStyle}>Дата</label>
                <NativeDateField value={date} onChange={setDate} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Время</label>
                <NativeTimeField value={time} onChange={setTime} />
              </div>
            </div>

            {/* Price & min players */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={labelStyle}>Цена с игрока, ₸</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  placeholder="0"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Мин. игроков</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(e.target.value)}
                  min="1"
                  placeholder="1"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* City — defaults to team city; affects venue list. Same chip-group pattern as type. */}
            <SheetChipGroup
              label="Город"
              options={cityOptions}
              value={city}
              onChange={setCity}
              emptyLabel={null}
            />

            {/* Venue — native select kept (long, dynamic list); chevron added via background-image */}
            <div>
              <label className={labelClass} style={labelStyle}>Площадка</label>
              <select
                value={venueSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "none") {
                    setVenueMode("none");
                    setSelectedVenueId("");
                    setVenueCost("");
                  } else if (v === "__new__") {
                    setVenueMode("new");
                    setSelectedVenueId("");
                    setVenueCost("");
                  } else {
                    setVenueMode("existing");
                    setSelectedVenueId(v);
                    const picked = venueOptions.find((vo) => vo.id === v);
                    setVenueCost(
                      picked?.default_cost != null ? String(picked.default_cost) : "",
                    );
                  }
                }}
                className={inputClass + " pr-10"}
                style={{
                  ...inputStyle,
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='1,1 6,7 11,1' /></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                }}
              >
                <option value="none">Не указана</option>
                {venueOptions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} — {v.address}</option>
                ))}
                <option value="__new__">+ Новая площадка</option>
              </select>
              {venueOptions.length === 0 && (
                <p className="text-[12px] mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                  В городе «{city}» пока нет площадок — добавьте новую.
                </p>
              )}
            </div>

            {venueMode === "new" && (
              <>
                <div>
                  <label className={labelClass} style={labelStyle}>Название</label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Например, Лужники"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Адрес</label>
                  <input
                    type="text"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Адрес"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Район</label>
                  <DistrictSelect
                    city={city}
                    value={venueDistrictId}
                    onChange={setVenueDistrictId}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {venueMode !== "none" && (
              <div>
                <label className={labelClass} style={labelStyle}>Стоимость площадки, ₸</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={venueCost}
                  onChange={(e) => setVenueCost(e.target.value)}
                  min="0"
                  placeholder="0"
                  className={inputClass}
                  style={inputStyle}
                />
                {venueMode === "existing" &&
                  (() => {
                    const picked = venueOptions.find((v) => v.id === selectedVenueId);
                    if (picked?.default_cost == null) return null;
                    return (
                      <p
                        className="text-[12px] mt-1.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Подставлена стандартная цена площадки. Можно изменить для конкретного события.
                      </p>
                    );
                  })()}
                {venueMode === "new" && (
                  <p
                    className="text-[12px] mt-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Эта цена сохранится как стандартная цена площадки.
                  </p>
                )}
              </div>
            )}

            {/* Description — multi-line, height auto-fits two rows */}
            <div>
              <label className={labelClass} style={labelStyle}>Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Необязательно"
                className="block w-full px-4 py-3 rounded-[12px] text-[14px] outline-none transition-colors focus:border-green-500 resize-none"
                style={inputStyle}
              />
            </div>

            {/* Public toggle */}
            <div
              className="flex items-center gap-3 p-3 rounded-[14px]"
              style={{ background: "var(--bg-secondary)" }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic((v) => !v)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
                style={{ background: isPublic ? "var(--green-500)" : "var(--gray-300)" }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: isPublic ? "translateX(22px)" : "translateX(4px)" }}
                />
              </button>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Публичное событие
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  Видно всем в поиске
                </p>
              </div>
            </div>
          </div>

          {/* Sticky footer with primary CTA — uses ДС Button */}
          <div
            className="px-4 pt-3 pb-5 shrink-0 bg-white"
            style={{ borderTop: "1px solid var(--gray-100)" }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!date || !time}
              loading={sending}
              className="w-full"
            >
              Создать событие
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Date / Time fields (native picker, custom display) ──────────────────────
//
// Why: native `<input type="date|time">` looks broken on iOS — it leaks the
// system placeholder ("yyyy-mm-dd"), centers/aligns text inconsistently and
// can't be height-locked. We render a styled button that visually matches
// the rest of the form and use the hidden input's `showPicker()` API to open
// the real iOS/Android system picker on tap.

const FIELD_CLASS =
  "block w-full h-[46px] px-4 rounded-[12px] text-[14px] text-left flex items-center justify-between transition-colors";
const FIELD_STYLE: React.CSSProperties = {
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  border: "1.5px solid var(--gray-200)",
  minWidth: 0,
};

const RU_WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const RU_MONTHS = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function formatDateLabel(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  return `${RU_WEEKDAYS[dt.getDay()]}, ${dt.getDate()} ${RU_MONTHS[dt.getMonth()]}`;
}

function NativeDateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  };
  const display = value ? formatDateLabel(value) : "Выбери дату";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className={FIELD_CLASS}
        style={FIELD_STYLE}
      >
        <span style={{ color: value ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          {display}
        </span>
        <CalendarIcon />
      </button>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}

function NativeTimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.click();
  };
  const display = value || "Выбери время";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className={FIELD_CLASS}
        style={FIELD_STYLE}
      >
        <span
          className="tabular-nums"
          style={{ color: value ? "var(--text-primary)" : "var(--text-tertiary)" }}
        >
          {display}
        </span>
        <ClockIcon />
      </button>
      <input
        ref={ref}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)" }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)" }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
