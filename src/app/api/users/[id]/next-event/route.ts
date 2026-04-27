import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type EventRow = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  price_per_player: number;
  min_players: number;
  is_public: boolean;
  teams: { id: string; name: string } | null;
  venues: { id: string; name: string; address: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const supabase = getServiceClient();

  const SELECT =
    "id, type, date, team_id, price_per_player, min_players, is_public, status, teams(id, name), venues(id, name, address)";

  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (memberships ?? []).map((m) => m.team_id);

  const { data: votes } = await supabase
    .from("event_attendances")
    .select("event_id")
    .eq("user_id", userId)
    .eq("vote", "yes");

  const votedEventIds = (votes ?? []).map((v) => v.event_id).filter(Boolean);

  if (teamIds.length === 0 && votedEventIds.length === 0) {
    return NextResponse.json({ event: null });
  }

  const fetchers: Promise<EventRow[]>[] = [];

  if (teamIds.length > 0) {
    fetchers.push(
      (async () => {
        const { data } = await supabase
          .from("events")
          .select(SELECT)
          .neq("status", "completed")
          .neq("status", "cancelled")
          .in("team_id", teamIds)
          .order("date", { ascending: true })
          .limit(5);
        return (data ?? []) as unknown as EventRow[];
      })(),
    );
  }

  if (votedEventIds.length > 0) {
    fetchers.push(
      (async () => {
        const { data } = await supabase
          .from("events")
          .select(SELECT)
          .neq("status", "completed")
          .neq("status", "cancelled")
          .in("id", votedEventIds)
          .order("date", { ascending: true })
          .limit(5);
        return (data ?? []) as unknown as EventRow[];
      })(),
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

  const [
    { count: yesCount },
    { count: noCount },
    { count: teamMembersCount },
    { data: attendance },
  ] = await Promise.all([
    supabase
      .from("event_attendances")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("vote", "yes"),
    supabase
      .from("event_attendances")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("vote", "no"),
    supabase
      .from("team_memberships")
      .select("*", { count: "exact", head: true })
      .eq("team_id", event.team_id),
    supabase
      .from("event_attendances")
      .select("vote")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const yes = yesCount ?? 0;
  const no = noCount ?? 0;
  const total = teamMembersCount ?? 0;
  const waiting = Math.max(0, total - yes - no);

  return NextResponse.json({
    event: {
      id: event.id,
      type: event.type,
      date: event.date,
      team_id: event.team_id,
      price_per_player: event.price_per_player,
      min_players: event.min_players,
      is_public: event.is_public,
      team: event.teams,
      venue: event.venues,
      yes_count: yes,
      no_count: no,
      waiting_count: waiting,
      total_members: total,
      user_vote: attendance?.vote ?? null,
    },
  });
}
