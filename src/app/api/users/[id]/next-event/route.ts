import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type EventRow = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  teams: { id: string; name: string } | null;
  venues: { id: string; name: string; address: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const SELECT = "id, type, date, team_id, teams(id, name), venues(id, name, address)";

  // Get user's team IDs
  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (memberships ?? []).map((m) => m.team_id);

  // Get event IDs where user voted yes
  const { data: votes } = await supabase
    .from("event_attendances")
    .select("event_id")
    .eq("user_id", userId)
    .eq("vote", "yes");

  const votedEventIds = (votes ?? []).map((v) => v.event_id).filter(Boolean);

  if (teamIds.length === 0 && votedEventIds.length === 0) {
    return NextResponse.json({ event: null });
  }

  // Fetch from both sources, merge, deduplicate
  const fetchers: Promise<EventRow[]>[] = [];

  if (teamIds.length > 0) {
    fetchers.push(
      supabase
        .from("events")
        .select(SELECT)
        .eq("status", "planned")
        .gt("date", now)
        .in("team_id", teamIds)
        .order("date", { ascending: true })
        .limit(5)
        .then(({ data }) => (data ?? []) as unknown as EventRow[]),
    );
  }

  if (votedEventIds.length > 0) {
    fetchers.push(
      supabase
        .from("events")
        .select(SELECT)
        .eq("status", "planned")
        .gt("date", now)
        .in("id", votedEventIds)
        .order("date", { ascending: true })
        .limit(5)
        .then(({ data }) => (data ?? []) as unknown as EventRow[]),
    );
  }

  const results = await Promise.all(fetchers);
  const all = results.flat();
  const seen = new Set<string>();
  const unique = all.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const event = unique[0] ?? null;
  if (!event) return NextResponse.json({ event: null });

  // Count yes votes for this event
  const { count: yesCount } = await supabase
    .from("event_attendances")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("vote", "yes");

  return NextResponse.json({
    event: {
      id: event.id,
      type: event.type,
      date: event.date,
      team_id: event.team_id,
      team: event.teams,
      venue: event.venues,
      yes_count: yesCount ?? 0,
    },
  });
}
