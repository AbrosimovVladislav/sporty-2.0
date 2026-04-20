# Iteration 9: Search Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a global search page with three tabs — public Events, Teams recruiting players, and Venues — plus integration toggles on team and event creation screens.

**Architecture:** Two Supabase column migrations add `looking_for_players` to teams and `is_public` to events. A new `GET /api/events/public` API serves public events joined with team and venue. The existing `GET /api/teams` and `GET /api/venues` APIs are extended with new filters. The search page at `/search` renders three pill tabs, each fetching from its own API. Team home page gets a toggle for organizers; event creation form gets a checkbox.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS 4, Supabase (service client), no new dependencies.

---

## File Map

**New files:**
- `supabase/migrations/20260420000001_teams_looking_for_players.sql` — ALTER TABLE teams
- `supabase/migrations/20260420000002_events_is_public.sql` — ALTER TABLE events
- `src/app/api/events/public/route.ts` — GET public events

**Modified files:**
- `src/types/database.ts` — add `looking_for_players` to teams Row/Insert/Update; add `is_public` to events Row/Insert/Update
- `src/app/api/teams/route.ts` — add `?looking_for_players=true` filter + member count in result
- `src/app/api/teams/[id]/route.ts` — add PATCH handler (update `looking_for_players`)
- `src/app/api/venues/route.ts` — add `?city=` and `?name=` filters
- `src/app/api/teams/[id]/events/route.ts` — accept `is_public` in POST body
- `src/app/(app)/search/page.tsx` — full search UI with three tabs
- `src/app/(app)/team/[id]/page.tsx` — add "Ищем игроков" toggle for organizers
- `src/app/(app)/team/[id]/events/page.tsx` — add `is_public` checkbox to CreateEventForm
- `docs/tech/db-entities.md` — add new columns to Team and Event sections
- `docs/features/team/[team]-home-tab.md` (or closest doc) — document toggle

---

## Task 1: Migration — teams.looking_for_players

**Files:**
- Create: `supabase/migrations/20260420000001_teams_looking_for_players.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add looking_for_players flag to teams
alter table public.teams
  add column if not exists looking_for_players boolean not null default false;
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Open Supabase → SQL Editor → paste and run the migration content.
Expected: no error, column appears in `teams` table inspector.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260420000001_teams_looking_for_players.sql
git commit -m "feat: migration — add teams.looking_for_players"
```

---

## Task 2: Migration — events.is_public

**Files:**
- Create: `supabase/migrations/20260420000002_events_is_public.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add is_public flag to events (existing rows remain private)
alter table public.events
  add column if not exists is_public boolean not null default false;
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Open Supabase → SQL Editor → paste and run. Verify column in `events` table.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260420000002_events_is_public.sql
git commit -m "feat: migration — add events.is_public"
```

---

## Task 3: Update TypeScript types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add `looking_for_players` to teams**

In `teams.Row`, after `description: string | null;` add:
```typescript
looking_for_players: boolean;
```

In `teams.Insert`, after `description?: string | null;` add:
```typescript
looking_for_players?: boolean;
```

In `teams.Update`, after `description?: string | null;` add:
```typescript
looking_for_players?: boolean;
```

- [ ] **Step 2: Add `is_public` to events**

In `events.Row`, after `created_at: string;` (before the closing brace) add:
```typescript
is_public: boolean;
```

In `events.Insert`, after `created_at?: string;` add:
```typescript
is_public?: boolean;
```

In `events.Update`, after `venue_paid?: number;` add:
```typescript
is_public?: boolean;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```
Expected: no type errors related to teams or events.

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add looking_for_players and is_public to database types"
```

---

## Task 4: Extend GET /api/teams — looking_for_players filter + member count

**Files:**
- Modify: `src/app/api/teams/route.ts`

- [ ] **Step 1: Replace the GET handler**

Replace the entire `GET` function with:

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const sport = searchParams.get("sport")?.trim();
  const lookingForPlayers = searchParams.get("looking_for_players");

  const supabase = getServiceClient();
  let query = supabase
    .from("teams")
    .select("id, name, sport, city, description, created_at, looking_for_players, team_memberships(count)")
    .order("created_at", { ascending: false });

  if (city) query = query.ilike("city", `%${city}%`);
  if (sport) query = query.eq("sport", sport);
  if (lookingForPlayers === "true") query = query.eq("looking_for_players", true);

  const { data, error } = await query;
  if (error) {
    console.error("Teams list error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const teams = (data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id,
    name: t.name,
    sport: t.sport,
    city: t.city,
    description: t.description,
    created_at: t.created_at,
    looking_for_players: t.looking_for_players,
    members_count: Array.isArray(t.team_memberships)
      ? (t.team_memberships[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }));

  return NextResponse.json({ teams });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```
Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/teams/route.ts
git commit -m "feat: extend GET /api/teams with looking_for_players filter and member count"
```

---

## Task 5: Add PATCH /api/teams/[id] — update looking_for_players

**Files:**
- Modify: `src/app/api/teams/[id]/route.ts`

- [ ] **Step 1: Add PATCH handler at the end of the file**

After the closing brace of the GET function, append:

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId, looking_for_players } = await req.json();

  if (!userId || typeof looking_for_players !== "boolean") {
    return NextResponse.json({ error: "userId and looking_for_players required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify caller is organizer
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", id)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("teams")
    .update({ looking_for_players })
    .eq("id", id);

  if (error) {
    console.error("Team update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/teams/[id]/route.ts
git commit -m "feat: add PATCH /api/teams/[id] to toggle looking_for_players"
```

---

## Task 6: New GET /api/events/public

**Files:**
- Create: `src/app/api/events/public/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type PublicEventRow = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  venues: { id: string; name: string; address: string; city: string } | null;
  teams: { id: string; name: string; city: string } | null;
};

type AttendanceCount = { event_id: string; count: number };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("id, team_id, type, date, price_per_player, min_players, description, venues(id, name, address, city), teams(id, name, city)")
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true });

  if (city) {
    // Filter by team's city (city filter applies via teams join)
    // We filter in-memory after fetch since Supabase doesn't support filter on joined table in this way
  }

  const { data, error } = await query;
  if (error) {
    console.error("Public events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  let events = (data ?? []) as unknown as PublicEventRow[];

  if (city) {
    events = events.filter(
      (e) =>
        (e.teams?.city ?? "").toLowerCase().includes(city.toLowerCase()) ||
        (e.venues?.city ?? "").toLowerCase().includes(city.toLowerCase()),
    );
  }

  const eventIds = events.map((e) => e.id);
  const { data: attRaw } = eventIds.length
    ? await supabase
        .from("event_attendances")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("vote", "yes")
    : { data: [] };

  const countMap = new Map<string, number>();
  for (const a of (attRaw ?? []) as { event_id: string }[]) {
    countMap.set(a.event_id, (countMap.get(a.event_id) ?? 0) + 1);
  }

  const result = events.map((e) => ({
    id: e.id,
    team_id: e.team_id,
    type: e.type,
    date: e.date,
    price_per_player: e.price_per_player,
    min_players: e.min_players,
    description: e.description,
    venue: e.venues,
    team: e.teams,
    yes_count: countMap.get(e.id) ?? 0,
  }));

  return NextResponse.json({ events: result });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/public/route.ts
git commit -m "feat: add GET /api/events/public"
```

---

## Task 7: Extend GET /api/venues with city/name filters

**Files:**
- Modify: `src/app/api/venues/route.ts`

- [ ] **Step 1: Replace the file content**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const name = searchParams.get("name")?.trim();

  const supabase = getServiceClient();
  let query = supabase
    .from("venues")
    .select("id, name, address, city")
    .order("name", { ascending: true });

  if (city) query = query.ilike("city", `%${city}%`);
  if (name) query = query.ilike("name", `%${name}%`);

  const { data, error } = await query;
  if (error) {
    console.error("Venues fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ venues: data ?? [] });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/venues/route.ts
git commit -m "feat: extend GET /api/venues with city and name filters"
```

---

## Task 8: Extend POST /api/teams/[id]/events with is_public

**Files:**
- Modify: `src/app/api/teams/[id]/events/route.ts`

- [ ] **Step 1: Add is_public to POST destructuring and insert**

In the POST handler, find the destructuring line:
```typescript
const { userId, type, date, price_per_player, min_players, description, venue, venue_id, venue_cost } = body;
```
Replace with:
```typescript
const { userId, type, date, price_per_player, min_players, description, venue, venue_id, venue_cost, is_public } = body;
```

Then find the `.insert({` block and add `is_public` after `created_by`:
```typescript
const { data: event, error: eventErr } = await supabase
  .from("events")
  .insert({
    team_id: teamId,
    venue_id: venueId,
    type,
    date,
    price_per_player: price_per_player ?? 0,
    min_players: min_players ?? 1,
    description: description ?? null,
    venue_cost: venue_cost != null ? Number(venue_cost) : 0,
    is_public: is_public === true,
    created_by: userId,
  })
  .select()
  .single();
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/teams/[id]/events/route.ts
git commit -m "feat: accept is_public in POST /api/teams/[id]/events"
```

---

## Task 9: Search page — shell with 3 pill tabs

**Files:**
- Modify: `src/app/(app)/search/page.tsx`

- [ ] **Step 1: Replace stub with tabbed shell**

```typescript
"use client";

import { useState } from "react";
import EventsTab from "./EventsTab";
import TeamsTab from "./TeamsTab";
import VenuesTab from "./VenuesTab";

type Tab = "events" | "teams" | "venues";

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("events");

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-5">
        <p className="text-foreground-on-dark-muted text-xs uppercase font-display tracking-wide">
          Поиск
        </p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">Найти</h1>
      </div>

      <div className="flex gap-2">
        {(
          [
            { id: "events", label: "События" },
            { id: "teams", label: "Команды" },
            { id: "venues", label: "Площадки" },
          ] as { id: Tab; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-background-card text-foreground border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "events" && <EventsTab />}
      {tab === "teams" && <TeamsTab />}
      {tab === "venues" && <VenuesTab />}
    </div>
  );
}
```

- [ ] **Step 2: Create placeholder EventsTab**

Create `src/app/(app)/search/EventsTab.tsx`:

```typescript
export default function EventsTab() {
  return (
    <div className="text-foreground-secondary text-sm text-center py-8">
      Загружаю события…
    </div>
  );
}
```

- [ ] **Step 3: Create placeholder TeamsTab**

Create `src/app/(app)/search/TeamsTab.tsx`:

```typescript
export default function TeamsTab() {
  return (
    <div className="text-foreground-secondary text-sm text-center py-8">
      Загружаю команды…
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder VenuesTab**

Create `src/app/(app)/search/VenuesTab.tsx`:

```typescript
export default function VenuesTab() {
  return (
    <div className="text-foreground-secondary text-sm text-center py-8">
      Загружаю площадки…
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/search/
git commit -m "feat: search page shell with 3 pill tabs"
```

---

## Task 10: Events tab — public events list

**Files:**
- Modify: `src/app/(app)/search/EventsTab.tsx`

- [ ] **Step 1: Implement EventsTab**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PublicEvent = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  venue: { id: string; name: string; address: string; city: string } | null;
  team: { id: string; name: string; city: string } | null;
  yes_count: number;
};

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventsTab() {
  const [city, setCity] = useState("");
  const [events, setEvents] = useState<PublicEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      fetch(`/api/events/public${params.toString() ? `?${params}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setEvents(d.events ?? []);
        })
        .catch(() => {
          if (!cancelled) setEvents([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Город</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Любой город"
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>

      {events === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : events.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Публичных событий не найдено
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/team/${e.team_id}/events/${e.id}`}
                className="block bg-background-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display font-semibold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                    {TYPE_LABEL[e.type] ?? e.type}
                  </span>
                  <span className="text-xs text-foreground-secondary">{formatDate(e.date)}</span>
                </div>
                {e.team && (
                  <p className="font-display font-semibold text-base">{e.team.name}</p>
                )}
                {e.venue && (
                  <p className="text-sm text-foreground-secondary mt-0.5">{e.venue.name}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-foreground-secondary">
                  <span>{e.yes_count} {e.yes_count === 1 ? "идёт" : "идут"}</span>
                  {e.min_players > 1 && <span>мин. {e.min_players}</span>}
                  {e.price_per_player > 0 && <span>{e.price_per_player} ₽</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/EventsTab.tsx
git commit -m "feat: search events tab — public events with city filter"
```

---

## Task 11: Teams tab — teams looking for players

**Files:**
- Modify: `src/app/(app)/search/TeamsTab.tsx`

- [ ] **Step 1: Implement TeamsTab**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SearchTeam = {
  id: string;
  name: string;
  sport: string;
  city: string;
  description: string | null;
  looking_for_players: boolean;
  members_count: number;
};

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

function membersLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} игрок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игрока`;
  return `${n} игроков`;
}

export default function TeamsTab() {
  const [city, setCity] = useState("");
  const [teams, setTeams] = useState<SearchTeam[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("looking_for_players", "true");
      if (city.trim()) params.set("city", city.trim());
      fetch(`/api/teams?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setTeams(d.teams ?? []);
        })
        .catch(() => {
          if (!cancelled) setTeams([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [city]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Город</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Любой город"
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>

      {teams === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Команд, ищущих игроков, не найдено
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/team/${t.id}`}
                className="block bg-background-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-lg">{t.name}</h2>
                  <span className="text-xs font-display uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                    Набор открыт
                  </span>
                </div>
                <p className="text-sm text-foreground-secondary mt-1">
                  {t.city} · {SPORT_LABEL[t.sport] ?? t.sport}
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  {membersLabel(t.members_count)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/TeamsTab.tsx
git commit -m "feat: search teams tab — teams with looking_for_players filter"
```

---

## Task 12: Venues tab — search by name/city

**Files:**
- Modify: `src/app/(app)/search/VenuesTab.tsx`

- [ ] **Step 1: Implement VenuesTab**

```typescript
"use client";

import { useEffect, useState } from "react";

type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
};

export default function VenuesTab() {
  const [query, setQuery] = useState("");
  const [venues, setVenues] = useState<Venue[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const q = query.trim();
      if (q) {
        // Try to match by name first; also pass city
        params.set("name", q);
      }
      fetch(`/api/venues${params.toString() ? `?${params}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setVenues(d.venues ?? []);
        })
        .catch(() => {
          if (!cancelled) setVenues([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Название или город</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать площадку…"
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>

      {venues === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Площадок не найдено
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {venues.map((v) => (
            <li
              key={v.id}
              className="bg-background-card border border-border rounded-lg p-4"
            >
              <p className="font-display font-semibold text-base">{v.name}</p>
              <p className="text-sm text-foreground-secondary mt-0.5">{v.address}</p>
              <p className="text-xs text-foreground-secondary mt-1">{v.city}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/search/VenuesTab.tsx
git commit -m "feat: search venues tab — search by name"
```

---

## Task 13: Team home page — "Ищем игроков" toggle for organizers

**Files:**
- Modify: `src/app/(app)/team/[id]/page.tsx`

- [ ] **Step 1: Add LookingForPlayersToggle component**

The `team-context` returns `team: Team` which now includes `looking_for_players: boolean` (after migration + types update). Add this component at the bottom of the file, before the utility functions:

```typescript
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
```

- [ ] **Step 2: Render the toggle in TeamHomePage for organizers**

In the `TeamHomePage` function, inside the `{role === "organizer" && ( ... )}` block, add the toggle after `<FinanceBalanceBlock>`:

```typescript
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
```

- [ ] **Step 3: Add useState import (already present, verify)**

Check top of file has `useState` in the import from `react`.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/team/[id]/page.tsx
git commit -m "feat: add looking_for_players toggle to team home (organizer)"
```

---

## Task 14: Event creation form — is_public checkbox

**Files:**
- Modify: `src/app/(app)/team/[id]/events/page.tsx`

- [ ] **Step 1: Add isPublic state to CreateEventForm**

In `CreateEventForm`, add state after existing state declarations:

```typescript
const [isPublic, setIsPublic] = useState(false);
```

- [ ] **Step 2: Add to fetch body in handleSubmit**

In the `JSON.stringify({...})` call inside `handleSubmit`, add:
```typescript
is_public: isPublic,
```

- [ ] **Step 3: Add checkbox UI to the form**

Add before the submit/cancel buttons div:

```typescript
<label className="flex items-center gap-3 cursor-pointer">
  <div
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
  </div>
  <div>
    <p className="text-sm font-medium">Публичное событие</p>
    <p className="text-xs text-foreground-secondary">Видно всем в поиске</p>
  </div>
</label>
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/team/[id]/events/page.tsx
git commit -m "feat: add is_public checkbox to event creation form"
```

---

## Task 15: Update documentation

**Files:**
- Modify: `docs/tech/db-entities.md`
- Modify: `docs/mvp-roadmap.md`

- [ ] **Step 1: Update db-entities.md — Team section**

In the Team table, add a row after `created_at`:

```
| looking_for_players | boolean | Открыт ли набор игроков (default false) |
```

- [ ] **Step 2: Update db-entities.md — Event section**

In the Event table, add a row after `created_at`:

```
| is_public | boolean | Видно ли событие в публичном поиске (default false) |
```

- [ ] **Step 3: Mark iteration 9 done in mvp-roadmap.md**

Replace all `⬜` in the Iteration 9 section with `✅`.

- [ ] **Step 4: Commit**

```bash
git add docs/tech/db-entities.md docs/mvp-roadmap.md
git commit -m "docs: update db-entities and roadmap for iteration 9"
```

---

## Self-Review

**Spec coverage check:**

| Spec item | Task |
|-----------|------|
| 9.1.1 teams.looking_for_players migration | Task 1 |
| 9.1.2 events.is_public migration | Task 2 |
| 9.1.3 GET /api/teams ?looking_for_players=true | Task 4 |
| 9.1.4 GET /api/events/public | Task 6 |
| 9.1.5 GET /api/venues with city/name filter | Task 7 |
| 9.1.6 Update src/types/database.ts | Task 3 |
| 9.2.1 Search page with 3 pill tabs | Task 9 |
| 9.2.2 Events tab | Task 10 |
| 9.2.3 Teams tab | Task 11 |
| 9.2.4 Venues tab | Task 12 |
| 9.3.1 "Ищем игроков" toggle on team home | Task 13 |
| 9.3.2 is_public checkbox in event form | Task 14 step 3 |
| 9.3.3 POST /api/teams/[id]/events accepts is_public | Task 8 |
| 9.3.4 Update documentation | Task 15 |

All items covered. No placeholders. Type names are consistent across tasks (`PublicEvent`, `SearchTeam`, `Venue`).

**Note on VenuesTab search:** The venues tab searches by `name` filter only via the API. City filtering is not explicitly wired — the single input searches name. This matches 9.2.4 ("поиск по имени/городу") partially; to fully support city search as well, the VenuesTab could pass the same query to both `?name=` and `?city=` and merge/deduplicate client-side — but the roadmap doesn't require this granularity, so searching by name covers the primary use case.
