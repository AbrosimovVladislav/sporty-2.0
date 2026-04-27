import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type EventRow = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  teams: { id: string; name: string } | null;
  venues: { id: string; name: string } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(20, Number(searchParams.get("limit")) || 3));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (memberships ?? []).map((m) => m.team_id);

  if (teamIds.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const { data: rawEvents, error } = await supabase
    .from("events")
    .select("id, type, date, team_id, teams(id, name), venues(id, name)")
    .in("team_id", teamIds)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Schedule fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const events = (rawEvents ?? []) as unknown as EventRow[];

  if (events.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const eventIds = events.map((e) => e.id);
  const { data: rawAtt } = await supabase
    .from("event_attendances")
    .select("event_id, vote")
    .eq("user_id", userId)
    .in("event_id", eventIds);

  const voteByEvent = new Map<string, "yes" | "no">();
  for (const a of rawAtt ?? []) {
    const att = a as { event_id: string; vote: "yes" | "no" };
    voteByEvent.set(att.event_id, att.vote);
  }

  const result = events.map((e) => ({
    id: e.id,
    type: e.type,
    date: e.date,
    team_id: e.team_id,
    team: e.teams,
    venue: e.venues,
    user_vote: voteByEvent.get(e.id) ?? null,
  }));

  return NextResponse.json({ events: result });
}
