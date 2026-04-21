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
  } | null;
  teams: { id: string; name: string; city: string } | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const district_id = searchParams.get("district_id")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, team_id, type, date, price_per_player, min_players, description, venues(id, name, address, city, district_id, districts(id, name)), teams(id, name, city)")
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true });

  if (error) {
    console.error("Public events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  let filtered = (data ?? []) as unknown as PublicEventRow[];

  if (city) {
    filtered = filtered.filter(
      (e) =>
        (e.teams?.city ?? "").toLowerCase().includes(city.toLowerCase()) ||
        (e.venues?.city ?? "").toLowerCase().includes(city.toLowerCase()),
    );
  }

  if (district_id) {
    filtered = filtered.filter((e) => e.venues?.district_id === district_id);
  }

  const paged = filtered.slice(offset, offset + limit);
  const nextOffset = offset + limit < filtered.length ? offset + limit : null;

  const eventIds = paged.map((e) => e.id);
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

  const result = paged.map((e) => ({
    id: e.id,
    team_id: e.team_id,
    type: e.type,
    date: e.date,
    price_per_player: e.price_per_player,
    min_players: e.min_players,
    description: e.description,
    venue: e.venues
      ? {
          id: e.venues.id,
          name: e.venues.name,
          address: e.venues.address,
          city: e.venues.city,
          district: e.venues.districts ?? null,
        }
      : null,
    team: e.teams,
    yes_count: countMap.get(e.id) ?? 0,
  }));

  return NextResponse.json({ events: result, nextOffset });
}
