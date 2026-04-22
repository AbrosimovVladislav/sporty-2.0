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
  venue_cost: number;
  venue_paid: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  venues: { id: string; name: string; address: string } | null;
};

type AttendanceWithUser = {
  id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  users: { id: string; name: string } | null;
};

type TransactionRow = {
  player_id: string;
  amount: number;
};

// GET — event detail with attendances
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id: teamId, eventId } = await params;

  const supabase = getServiceClient();

  const { data: rawEvent, error: eventErr } = await supabase
    .from("events")
    .select("id, team_id, type, date, price_per_player, min_players, description, status, venue_cost, venue_paid, is_public, created_by, created_at, venues(id, name, address)")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (eventErr) {
    console.error("Event fetch error:", eventErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!rawEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = rawEvent as unknown as EventWithVenue;

  const [{ data: rawAttendances, error: attErr }, { data: rawTx }] = await Promise.all([
    supabase
      .from("event_attendances")
      .select("id, user_id, vote, attended, users(id, name)")
      .eq("event_id", eventId),
    supabase
      .from("financial_transactions")
      .select("player_id, amount")
      .eq("event_id", eventId)
      .eq("type", "event_payment"),
  ]);

  if (attErr) {
    console.error("Attendances fetch error:", attErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const attendances = (rawAttendances ?? []) as unknown as AttendanceWithUser[];
  const txByPlayer = new Map<string, number>();
  for (const tx of (rawTx ?? []) as unknown as TransactionRow[]) {
    txByPlayer.set(tx.player_id, tx.amount);
  }

  return NextResponse.json({
    event: {
      id: event.id,
      team_id: event.team_id,
      type: event.type,
      date: event.date,
      price_per_player: event.price_per_player,
      min_players: event.min_players,
      description: event.description,
      status: event.status,
      venue_cost: event.venue_cost,
      venue_paid: event.venue_paid,
      is_public: event.is_public,
      created_by: event.created_by,
      created_at: event.created_at,
      venue: event.venues,
    },
    attendances: attendances
      .filter((a) => a.users !== null)
      .map((a) => {
        const txAmount = txByPlayer.get(a.user_id) ?? null;
        return {
          id: a.id,
          user_id: a.user_id,
          vote: a.vote,
          attended: a.attended,
          paid: txAmount !== null,
          paid_amount: txAmount,
          user: a.users!,
        };
      }),
  });
}

// PATCH — update event (organizer only). Supports status transition and venue_cost/venue_paid edits.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id: teamId, eventId } = await params;
  const body = await req.json();
  const { userId, status, venue_cost, venue_paid } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const hasStatus = status !== undefined;
  const hasVenueCost = venue_cost !== undefined;
  const hasVenuePaid = venue_paid !== undefined;

  if (!hasStatus && !hasVenueCost && !hasVenuePaid) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (hasStatus && !["completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (hasStatus && event.status !== "planned") {
    return NextResponse.json({ error: "Only planned events can change status" }, { status: 400 });
  }

  const update: {
    status?: "completed" | "cancelled";
    venue_cost?: number;
    venue_paid?: number;
  } = {};
  if (hasStatus) update.status = status;
  if (hasVenueCost) {
    const v = Number(venue_cost);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "venue_cost must be >= 0" }, { status: 400 });
    }
    update.venue_cost = v;
  }
  if (hasVenuePaid) {
    const v = Number(venue_paid);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "venue_paid must be >= 0" }, { status: 400 });
    }
    update.venue_paid = v;
  }

  const { error } = await supabase
    .from("events")
    .update(update)
    .eq("id", eventId);

  if (error) {
    console.error("Event update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(update);
}
