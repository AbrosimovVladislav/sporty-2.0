import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type Membership = {
  role: "organizer" | "player";
  teams: { id: string; name: string; sport: string; city: string } | null;
};

type NextEventRow = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  min_players: number;
  price_per_player: number;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data: rawMemberships } = await supabase
    .from("team_memberships")
    .select("role, teams(id, name, sport, city)")
    .eq("user_id", userId);

  const memberships = (rawMemberships ?? []) as unknown as Membership[];
  const teams = memberships
    .filter((m) => m.teams !== null)
    .map((m) => ({ ...m.teams!, role: m.role }));

  if (teams.length === 0) {
    return NextResponse.json({ teams: [] });
  }

  const teamIds = teams.map((t) => t.id);

  const { data: rawNextEvents } = await supabase
    .from("events")
    .select("id, type, date, team_id, min_players, price_per_player")
    .in("team_id", teamIds)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true });

  const nextEvents = (rawNextEvents ?? []) as unknown as NextEventRow[];
  const nextByTeam = new Map<string, NextEventRow>();
  for (const e of nextEvents) {
    if (!nextByTeam.has(e.team_id)) nextByTeam.set(e.team_id, e);
  }

  const eventIds = Array.from(nextByTeam.values()).map((e) => e.id);
  const yesCountByEvent = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: attendances } = await supabase
      .from("event_attendances")
      .select("event_id")
      .in("event_id", eventIds)
      .eq("vote", "yes");
    for (const a of attendances ?? []) {
      const eid = (a as { event_id: string }).event_id;
      yesCountByEvent.set(eid, (yesCountByEvent.get(eid) ?? 0) + 1);
    }
  }

  const orgTeamIds = teams.filter((t) => t.role === "organizer").map((t) => t.id);

  const requestsByTeam = new Map<string, number>();
  if (orgTeamIds.length > 0) {
    const { data: requests } = await supabase
      .from("join_requests")
      .select("team_id")
      .in("team_id", orgTeamIds)
      .eq("direction", "player_to_team")
      .eq("status", "pending");
    for (const r of requests ?? []) {
      const tid = (r as { team_id: string }).team_id;
      requestsByTeam.set(tid, (requestsByTeam.get(tid) ?? 0) + 1);
    }
  }

  const debtsByTeam = new Map<string, number>();
  if (orgTeamIds.length > 0) {
    const { data: completedEvents } = await supabase
      .from("events")
      .select("id, team_id, price_per_player")
      .in("team_id", orgTeamIds)
      .eq("status", "completed");

    const eventsByTeam = new Map<string, { id: string; price: number }[]>();
    const eventToTeam = new Map<string, string>();
    const priceByEvent = new Map<string, number>();
    for (const e of completedEvents ?? []) {
      const ev = e as { id: string; team_id: string; price_per_player: number };
      eventToTeam.set(ev.id, ev.team_id);
      priceByEvent.set(ev.id, ev.price_per_player);
      const list = eventsByTeam.get(ev.team_id) ?? [];
      list.push({ id: ev.id, price: ev.price_per_player });
      eventsByTeam.set(ev.team_id, list);
    }

    const completedIds = Array.from(eventToTeam.keys());

    if (completedIds.length > 0) {
      const { data: rawAtt } = await supabase
        .from("event_attendances")
        .select("user_id, event_id")
        .in("event_id", completedIds)
        .eq("attended", true);

      const expectedByTeamUser = new Map<string, Map<string, number>>();
      for (const a of rawAtt ?? []) {
        const att = a as { user_id: string; event_id: string };
        const tid = eventToTeam.get(att.event_id);
        if (!tid) continue;
        const price = priceByEvent.get(att.event_id) ?? 0;
        let teamMap = expectedByTeamUser.get(tid);
        if (!teamMap) {
          teamMap = new Map<string, number>();
          expectedByTeamUser.set(tid, teamMap);
        }
        teamMap.set(att.user_id, (teamMap.get(att.user_id) ?? 0) + price);
      }

      const { data: rawTx } = await supabase
        .from("financial_transactions")
        .select("player_id, team_id, amount")
        .in("team_id", orgTeamIds);

      const paidByTeamUser = new Map<string, Map<string, number>>();
      for (const tx of rawTx ?? []) {
        const t = tx as { player_id: string; team_id: string; amount: number };
        let teamMap = paidByTeamUser.get(t.team_id);
        if (!teamMap) {
          teamMap = new Map<string, number>();
          paidByTeamUser.set(t.team_id, teamMap);
        }
        teamMap.set(t.player_id, (teamMap.get(t.player_id) ?? 0) + t.amount);
      }

      for (const teamId of orgTeamIds) {
        const expected = expectedByTeamUser.get(teamId);
        if (!expected) continue;
        const paid = paidByTeamUser.get(teamId) ?? new Map<string, number>();
        let debtors = 0;
        for (const [uid, exp] of expected) {
          const p = paid.get(uid) ?? 0;
          if (exp - p > 0) debtors += 1;
        }
        if (debtors > 0) debtsByTeam.set(teamId, debtors);
      }
    }
  }

  const result = teams.map((team) => {
    const next = nextByTeam.get(team.id);
    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      city: team.city,
      role: team.role,
      next_event: next
        ? {
            id: next.id,
            type: next.type,
            date: next.date,
            yes_count: yesCountByEvent.get(next.id) ?? 0,
            min_players: next.min_players,
          }
        : null,
      pending_requests: requestsByTeam.get(team.id) ?? 0,
      debtors: debtsByTeam.get(team.id) ?? 0,
    };
  });

  return NextResponse.json({ teams: result });
}
