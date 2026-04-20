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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, team_id, type, date, price_per_player, min_players, description, venues(id, name, address, city), teams(id, name, city)")
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true });

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
