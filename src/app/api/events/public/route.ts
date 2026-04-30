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
  venue_id: string;
  venues: {
    id: string;
    name: string;
    address: string;
    city: string;
    district_id: string | null;
    districts: { id: string; name: string } | null;
  };
  teams: { id: string; name: string; city: string } | null;
};

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
  const sort: "date_asc" | "date_desc" | "price_asc" =
    sortRaw === "date_desc"
      ? "date_desc"
      : sortRaw === "price_asc"
      ? "price_asc"
      : "date_asc";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : null;
  const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : null;
  // Never expose past events: a date-range "from" in the past gets clamped to now.
  const effectiveFrom = fromIso && fromIso > now ? fromIso : now;

  // When filtering by has_spots we over-fetch and trim in memory because
  // yes_count is computed from event_attendances (no DB column).
  const dbLimit = hasSpots ? Math.min(limit * 4, 200) : limit;
  const dbOffset = hasSpots ? 0 : offset;

  let query = supabase
    .from("events")
    .select(
      "id, team_id, type, date, price_per_player, min_players, description, venue_id, venues!inner(id, name, address, city, district_id, districts(id, name)), teams!inner(id, name, city)",
      { count: "exact" },
    )
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", effectiveFrom);

  if (toIso) query = query.lte("date", toIso);

  if (sort === "date_desc") {
    query = query.order("date", { ascending: false });
  } else if (sort === "price_asc") {
    query = query
      .order("price_per_player", { ascending: true })
      .order("date", { ascending: true });
  } else {
    query = query.order("date", { ascending: true });
  }

  if (city) query = query.eq("venues.city", city);
  if (district_id) query = query.eq("venues.district_id", district_id);
  if (venue_id) query = query.eq("venue_id", venue_id);
  if (type) query = query.eq("type", type as "game" | "training" | "gathering" | "other");
  if (priceMax !== null && Number.isFinite(priceMax)) {
    query = query.lte("price_per_player", priceMax);
  }
  if (q) query = query.or(`name.ilike.%${q}%`, { foreignTable: "teams" });

  const { data, error, count } = await query.range(dbOffset, dbOffset + dbLimit - 1);

  if (error) {
    console.error("Public events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  let items = (data ?? []) as unknown as PublicEventRow[];

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
    items = items.filter(
      (e) => (countMap.get(e.id) ?? 0) < e.min_players,
    );
  }

  const sliced = hasSpots ? items.slice(offset, offset + limit) : items;
  const nextOffset = hasSpots
    ? items.length > offset + limit
      ? offset + limit
      : null
    : sliced.length === limit
    ? offset + limit
    : null;
  const total = hasSpots ? items.length : count ?? null;

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

  return NextResponse.json({ events: result, nextOffset, total });
}
