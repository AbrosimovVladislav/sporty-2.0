import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type RawRequest = {
  team_id: string;
  teams: { id: string; name: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const supabase = getServiceClient();

  const { data: orgMemberships } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("user_id", userId)
    .eq("role", "organizer");

  const orgTeamIds = (orgMemberships ?? []).map((m) => m.team_id);

  if (orgTeamIds.length === 0) {
    return NextResponse.json({ total: 0, by_team: [] });
  }

  const { data: rawRequests, error } = await supabase
    .from("join_requests")
    .select("team_id, teams(id, name)")
    .in("team_id", orgTeamIds)
    .eq("direction", "player_to_team")
    .eq("status", "pending");

  if (error) {
    console.error("Pending requests fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const requests = (rawRequests ?? []) as unknown as RawRequest[];

  const grouped = new Map<string, { team_id: string; team_name: string; count: number }>();
  for (const r of requests) {
    if (!r.teams) continue;
    const existing = grouped.get(r.team_id);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(r.team_id, {
        team_id: r.team_id,
        team_name: r.teams.name,
        count: 1,
      });
    }
  }

  const by_team = Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  const total = by_team.reduce((sum, t) => sum + t.count, 0);

  return NextResponse.json({ total, by_team });
}
