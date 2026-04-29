import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type RawAttendance = {
  vote: "yes" | "no" | null;
  attended: boolean | null;
  events: {
    id: string;
    type: string;
    date: string;
    status: string;
    team_id: string;
  } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id: teamId, userId: targetUserId } = await params;
  const { searchParams } = new URL(req.url);
  const requesterId = searchParams.get("userId");

  if (!requesterId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: requesterMembership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", requesterId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!requesterMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rawRows } = await supabase
    .from("event_attendances")
    .select(
      "vote, attended, events!inner(id, type, date, status, team_id)",
    )
    .eq("user_id", targetUserId)
    .eq("events.team_id", teamId)
    .eq("events.status", "completed")
    .order("events(date)", { ascending: false });

  const rows = (rawRows ?? []) as unknown as RawAttendance[];

  let votedYesCount = 0;
  let attendedCount = 0;
  let noShowCount = 0;
  let cancelledCount = 0;

  for (const r of rows) {
    if (r.vote === "yes") {
      votedYesCount += 1;
      if (r.attended) attendedCount += 1;
      else noShowCount += 1;
    } else if (r.vote === "no") {
      cancelledCount += 1;
    }
  }

  const reliability =
    votedYesCount > 0 ? Math.round((attendedCount / votedYesCount) * 100) : null;

  const recentEvents = rows
    .filter((r) => r.events)
    .slice(0, 10)
    .map((r) => ({
      event_id: r.events!.id,
      type: r.events!.type,
      date: r.events!.date,
      vote: r.vote,
      attended: r.attended,
    }));

  return NextResponse.json({
    totals: {
      played: attendedCount,
      votedYes: votedYesCount,
      noShow: noShowCount,
      cancelled: cancelledCount,
      reliability,
    },
    recentEvents,
  });
}
