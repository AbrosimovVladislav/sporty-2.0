import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type AttendanceRow = {
  id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  events: {
    id: string;
    team_id: string;
    type: string;
    date: string;
    status: string;
    price_per_player: number;
    teams: { id: string; name: string } | null;
  } | null;
};

// GET — player's event history with stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  const supabase = getServiceClient();

  const { data: rawData, error } = await supabase
    .from("event_attendances")
    .select("id, vote, attended, paid, events(id, team_id, type, date, status, price_per_player, teams(id, name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("User events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (rawData ?? []) as unknown as AttendanceRow[];

  const events = rows
    .filter((r) => r.events !== null)
    .map((r) => ({
      attendanceId: r.id,
      vote: r.vote,
      attended: r.attended,
      paid: r.paid,
      event: {
        id: r.events!.id,
        team_id: r.events!.team_id,
        type: r.events!.type,
        date: r.events!.date,
        status: r.events!.status,
        price_per_player: r.events!.price_per_player,
        team: r.events!.teams,
      },
    }));

  // Stats
  const completed = events.filter((e) => e.event.status === "completed");
  const attendedCount = completed.filter((e) => e.attended === true).length;
  const paidCount = completed.filter((e) => e.paid === true).length;

  return NextResponse.json({
    events,
    stats: {
      total: completed.length,
      attended: attendedCount,
      paid: paidCount,
    },
  });
}
