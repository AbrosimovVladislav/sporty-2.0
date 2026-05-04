import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { decodeCursor, encodeCursor, keysetClause } from "@/lib/cursor";

type PublicEventRow = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  venue_id: string;
  venues: {
    id: string;
    name: string;
    address: string | null;
    city: string;
    district_id: string | null;
    districts: { id: string; name: string } | null;
  };
  teams: { id: string; name: string; city: string } | null;
};

type SortMode = "date_asc" | "date_desc" | "price_asc";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? null;
  const type = searchParams.get("type")?.trim() ?? null;
  const city = searchParams.get("city")?.trim() ?? null;
  const district_id = searchParams.get("district_id")?.trim() ?? null;
  const venue_id = searchParams.get("venue")?.trim() ?? null;
  const from = searchParams.get("from")?.trim() ?? null;
  const to = searchParams.get("to")?.trim() ?? null;
  const priceMaxRaw = searchParams.get("price_max")?.trim() ?? null;
  const priceMax = priceMaxRaw !== null ? Number(priceMaxRaw) : null;
  const hasSpots = searchParams.get("has_spots") === "true";
  const sortRaw = searchParams.get("sort");
  const sort: SortMode =
    sortRaw === "date_desc"
      ? "date_desc"
      : sortRaw === "price_asc"
      ? "price_asc"
      : "date_asc";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    50,
  );
  const cursor = decodeCursor(searchParams.get("cursor"));

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : null;
  const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : null;
  // Never expose past events: a date-range "from" in the past gets clamped to now.
  const effectiveFrom = fromIso && fromIso > now ? fromIso : now;

  // has_spots requires per-event yes_count, which doesn't live in events.
  // Over-fetch and trim in JS — accepted MVP compromise. A denormalised
  // events.yes_count is a separate task (see roadmap 1.5.3).
  const dbLimit = hasSpots ? limit * 4 : limit + 1;

  // Total count is meaningful only on the first page and when has_spots is off
  // (has_spots filters in JS after fetch, so DB count would diverge).
  const wantCount = !cursor && !hasSpots;

  let query = supabase
    .from("events")
    .select(
      "id, team_id, type, date, price_per_player, min_players, description, venue_id, venues!inner(id, name, address, city, district_id, districts(id, name)), teams!inner(id, name, city)",
      wantCount ? { count: "exact" } : undefined,
    )
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", effectiveFrom);

  if (toIso) query = query.lte("date", toIso);

  // Apply ordering & cursor (keyset). Tie-break by id to keep page stable.
  if (sort === "date_desc") {
    query = query
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (cursor) query = query.or(keysetClause("date", cursor, "desc"));
  } else if (sort === "price_asc") {
    query = query
      .order("price_per_player", { ascending: true })
      .order("id", { ascending: true });
    if (cursor) query = query.or(keysetClause("price_per_player", cursor, "asc"));
  } else {
    query = query
      .order("date", { ascending: true })
      .order("id", { ascending: true });
    if (cursor) query = query.or(keysetClause("date", cursor, "asc"));
  }

  if (city) query = query.eq("venues.city", city);
  if (district_id) query = query.eq("venues.district_id", district_id);
  if (venue_id) query = query.eq("venue_id", venue_id);
  if (type) query = query.eq("type", type as "game" | "training" | "gathering" | "other");
  if (priceMax !== null && Number.isFinite(priceMax)) {
    query = query.lte("price_per_player", priceMax);
  }
  if (q) query = query.or(`name.ilike.%${q}%`, { foreignTable: "teams" });

  query = query.limit(dbLimit);

  const { data, error, count } = await query;

  if (error) {
    console.error("Public events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  let items = (data ?? []) as unknown as PublicEventRow[];

  // Always need yes_count for the row UI. If has_spots is on, also use it to filter.
  const eventIds = items.map((e) => e.id);
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

  if (hasSpots) {
    items = items.filter((e) => (countMap.get(e.id) ?? 0) < e.min_players);
  }

  const hasMore = !hasSpots
    ? items.length > limit
    : items.length >= limit;
  const sliced = items.slice(0, limit);

  const last = sliced[sliced.length - 1];
  let nextCursor: string | null = null;
  if (hasMore && last) {
    const v =
      sort === "price_asc" ? String(last.price_per_player) : last.date;
    nextCursor = encodeCursor({ v, id: last.id });
  }

  const result = sliced.map((e) => ({
    id: e.id,
    team_id: e.team_id,
    type: e.type,
    date: e.date,
    price_per_player: e.price_per_player,
    min_players: e.min_players,
    description: e.description,
    venue: {
      id: e.venues.id,
      name: e.venues.name,
      address: e.venues.address,
      city: e.venues.city,
      district: e.venues.districts ?? null,
    },
    team: e.teams,
    yes_count: countMap.get(e.id) ?? 0,
  }));

  return NextResponse.json({
    events: result,
    nextCursor,
    total: wantCount ? count ?? 0 : null,
  });
}
