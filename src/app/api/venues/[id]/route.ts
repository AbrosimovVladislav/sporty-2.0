import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type VenueDetailRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  district_id: string | null;
  default_cost: number | null;
  photo_url: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  districts: { id: string; name: string } | null;
};

type EventRow = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  teams: { id: string; name: string; city: string } | null;
};

const UPCOMING_LIMIT = 5;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: venueData, error: venueErr } = await supabase
    .from("venues")
    .select(
      "id, name, address, city, district_id, default_cost, photo_url, phone, website, description, districts(id, name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (venueErr) {
    console.error("Venue fetch error:", venueErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!venueData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const v = venueData as unknown as VenueDetailRow;
  const venue = {
    id: v.id,
    name: v.name,
    address: v.address,
    city: v.city,
    district_id: v.district_id,
    default_cost: v.default_cost,
    photo_url: v.photo_url,
    phone: v.phone,
    website: v.website,
    description: v.description,
    district: v.districts ?? null,
  };

  const now = new Date().toISOString();
  const { data: eventsData, count: upcomingCount } = await supabase
    .from("events")
    .select(
      "id, team_id, type, date, price_per_player, min_players, teams!inner(id, name, city)",
      { count: "exact" },
    )
    .eq("venue_id", id)
    .eq("is_public", true)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true })
    .range(0, UPCOMING_LIMIT - 1);

  const eventRows = (eventsData ?? []) as unknown as EventRow[];
  const eventIds = eventRows.map((e) => e.id);
  const { data: attRaw } = eventIds.length
    ? await supabase
        .from("event_attendances")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("vote", "yes")
    : { data: [] };

  const yesMap = new Map<string, number>();
  for (const a of (attRaw ?? []) as { event_id: string }[]) {
    yesMap.set(a.event_id, (yesMap.get(a.event_id) ?? 0) + 1);
  }

  const upcomingEvents = eventRows.map((e) => ({
    id: e.id,
    team_id: e.team_id,
    type: e.type,
    date: e.date,
    price_per_player: e.price_per_player,
    min_players: e.min_players,
    team: e.teams,
    yes_count: yesMap.get(e.id) ?? 0,
  }));

  return NextResponse.json({
    venue,
    upcomingEvents,
    upcomingTotal: upcomingCount ?? upcomingEvents.length,
  });
}
