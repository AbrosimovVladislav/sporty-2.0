import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  // Fetch all attendances for completed events where user voted "yes"
  const { data: attendances, error } = await supabase
    .from("event_attendances")
    .select("vote, attended, events!inner(status)")
    .eq("user_id", id)
    .eq("events.status", "completed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = attendances ?? [];
  const votedYes = rows.filter((r) => r.vote === "yes");
  const attended = votedYes.filter((r) => r.attended === true);

  const votedYesCount = votedYes.length;
  const attendedCount = attended.length;
  const reliability = votedYesCount > 0
    ? Math.round((attendedCount / votedYesCount) * 100)
    : null;

  // Total completed events attended (regardless of vote)
  const { data: allAttended } = await supabase
    .from("event_attendances")
    .select("events!inner(status)")
    .eq("user_id", id)
    .eq("attended", true)
    .eq("events.status", "completed");

  const playedCount = allAttended?.length ?? 0;

  // Last 10 completed events with vote/attendance info
  const { data: recent } = await supabase
    .from("event_attendances")
    .select("vote, attended, event_id, events!inner(id, type, date, status)")
    .eq("user_id", id)
    .eq("events.status", "completed")
    .order("events(date)", { ascending: false })
    .limit(10);

  const recentEvents = (recent ?? []).map((r) => {
    const ev = r.events as unknown as { id: string; type: string; date: string; status: string };
    return {
      event_id: ev.id,
      type: ev.type,
      date: ev.date,
      vote: r.vote,
      attended: r.attended,
    };
  });

  return NextResponse.json({
    playedCount,
    votedYesCount,
    attendedCount,
    reliability,
    recentEvents,
  });
}
