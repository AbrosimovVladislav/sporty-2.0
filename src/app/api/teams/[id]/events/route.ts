import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { getExpectedAmount, getPaidAmount } from "@/lib/finances";

type EventWithVenue = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  status: string;
  venue_cost: number;
  venue_paid: number;
  created_by: string;
  created_at: string;
  venues: { id: string; name: string; address: string } | null;
};

type AttendanceRow = {
  event_id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  paid_amount: number | null;
};

// GET — list team events
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("events")
    .select("id, team_id, type, date, price_per_player, min_players, description, status, venue_cost, venue_paid, created_by, created_at, venues(id, name, address)")
    .eq("team_id", teamId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const events = (data ?? []) as unknown as EventWithVenue[];
  const eventIds = events.map((e) => e.id);

  // Single batch fetch for all attendances of these events
  const { data: attRaw } = eventIds.length
    ? await supabase
        .from("event_attendances")
        .select("event_id, user_id, vote, attended, paid, paid_amount")
        .in("event_id", eventIds)
    : { data: [] as AttendanceRow[] };

  const attendances = (attRaw ?? []) as unknown as AttendanceRow[];
  const byEvent = new Map<string, AttendanceRow[]>();
  for (const a of attendances) {
    const list = byEvent.get(a.event_id) ?? [];
    list.push(a);
    byEvent.set(a.event_id, list);
  }

  const enriched = events.map((e) => {
    const list = byEvent.get(e.id) ?? [];
    const yesCount = list.filter((a) => a.vote === "yes").length;
    const noCount = list.filter((a) => a.vote === "no").length;
    const myVote = userId
      ? (list.find((a) => a.user_id === userId)?.vote ?? null)
      : null;

    const expectedCollected = list.reduce(
      (sum, a) => sum + getExpectedAmount(a, e.price_per_player),
      0,
    );
    const actualCollected = list.reduce(
      (sum, a) => sum + getPaidAmount(a, e.price_per_player),
      0,
    );

    return {
      id: e.id,
      type: e.type,
      date: e.date,
      price_per_player: e.price_per_player,
      min_players: e.min_players,
      description: e.description,
      status: e.status,
      venue_cost: e.venue_cost,
      venue_paid: e.venue_paid,
      venue: e.venues,
      yesCount,
      noCount,
      myVote,
      expectedCollected,
      actualCollected,
    };
  });

  return NextResponse.json({ events: enriched });
}

// POST — create event (organizer only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { userId, type, date, price_per_player, min_players, description, venue, venue_id, venue_cost } = body;

  if (!userId || !type || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify caller is organizer
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pick an existing venue, or create a new one from the form
  let venueId: string | null = venue_id ?? null;
  if (!venueId && venue && venue.name && venue.address) {
    const { data: v, error: vErr } = await supabase
      .from("venues")
      .insert({ name: venue.name, address: venue.address, city: venue.city ?? "", created_by: userId })
      .select("id")
      .single();

    if (vErr) {
      console.error("Venue create error:", vErr);
      return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
    }
    venueId = v.id;
  }

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
      created_by: userId,
    })
    .select()
    .single();

  if (eventErr) {
    console.error("Event create error:", eventErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
