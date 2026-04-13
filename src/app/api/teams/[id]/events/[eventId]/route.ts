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

type AttendanceWithUser = {
  id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  attended_confirmed: boolean | null;
  paid: boolean | null;
  paid_confirmed: boolean | null;
  users: { id: string; name: string } | null;
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
    .select("id, team_id, type, date, price_per_player, min_players, description, status, created_by, created_at, venues(id, name, address)")
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

  const { data: rawAttendances, error: attErr } = await supabase
    .from("event_attendances")
    .select("id, user_id, vote, attended, attended_confirmed, paid, paid_confirmed, users(id, name)")
    .eq("event_id", eventId);

  if (attErr) {
    console.error("Attendances fetch error:", attErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const attendances = (rawAttendances ?? []) as unknown as AttendanceWithUser[];

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
      created_by: event.created_by,
      created_at: event.created_at,
      venue: event.venues,
    },
    attendances: attendances
      .filter((a) => a.users !== null)
      .map((a) => ({
        id: a.id,
        user_id: a.user_id,
        vote: a.vote,
        attended: a.attended,
        attended_confirmed: a.attended_confirmed,
        paid: a.paid,
        paid_confirmed: a.paid_confirmed,
        user: a.users!,
      })),
  });
}
