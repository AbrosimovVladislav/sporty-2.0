import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type EventWithVenue = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  status: string;
  created_by: string;
  created_at: string;
  venues: { id: string; name: string; address: string } | null;
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
    .select("id, team_id, type, date, price_per_player, min_players, description, status, created_by, created_at, venues(id, name, address)")
    .eq("team_id", teamId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const events = (data ?? []) as unknown as EventWithVenue[];

  // For each event, get vote counts + current user's vote
  const enriched = await Promise.all(
    events.map(async (e) => {
      const { count: yesCount } = await supabase
        .from("event_attendances")
        .select("*", { count: "exact", head: true })
        .eq("event_id", e.id)
        .eq("vote", "yes");

      const { count: noCount } = await supabase
        .from("event_attendances")
        .select("*", { count: "exact", head: true })
        .eq("event_id", e.id)
        .eq("vote", "no");

      let myVote: "yes" | "no" | null = null;
      if (userId) {
        const { data: att } = await supabase
          .from("event_attendances")
          .select("vote")
          .eq("event_id", e.id)
          .eq("user_id", userId)
          .maybeSingle();
        if (att) myVote = att.vote as "yes" | "no" | null;
      }

      return {
        id: e.id,
        type: e.type,
        date: e.date,
        price_per_player: e.price_per_player,
        min_players: e.min_players,
        description: e.description,
        status: e.status,
        venue: e.venues,
        yesCount: yesCount ?? 0,
        noCount: noCount ?? 0,
        myVote,
      };
    }),
  );

  return NextResponse.json({ events: enriched });
}

// POST — create event (organizer only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { userId, type, date, price_per_player, min_players, description, venue } = body;

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

  // Create venue if provided
  let venueId: string | null = null;
  if (venue && venue.name && venue.address) {
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
