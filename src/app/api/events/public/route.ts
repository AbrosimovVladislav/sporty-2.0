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
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select(
      "id, team_id, type, date, price_per_player, min_players, description, venues!inner(id, name, address, city, district_id, districts(id, name)), teams!inner(id, name, city)",
      { count: "exact" },
    )
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true });

  if (city) query = query.eq("venues.city", city);
  if (district_id) query = query.eq("venues.district_id", district_id);
  if (type) query = query.eq("type", type as "game" | "training" | "gathering" | "other");
  if (q) query = query.or(`name.ilike.%${q}%`, { foreignTable: "teams" });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Public events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const items = (data ?? []) as unknown as PublicEventRow[];
  const nextOffset = items.length === limit ? offset + limit : null;

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

  const result = items.map((e) => ({
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

  return NextResponse.json({ events: result, nextOffset, total: count ?? null });
}
