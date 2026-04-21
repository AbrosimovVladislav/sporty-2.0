import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type JoinRequestRow = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  direction: "player_to_team" | "team_to_player";
  invited_by: string | null;
  created_at: string;
  resolved_at: string | null;
  teams: { id: string; name: string; city: string; sport: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("join_requests")
    .select("id, status, direction, invited_by, created_at, resolved_at, teams(id, name, city, sport)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("User join requests fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as JoinRequestRow[];

  // Collect unique inviter IDs to fetch their names
  const inviterIds = [...new Set(rows.map((r) => r.invited_by).filter(Boolean))] as string[];
  const inviterMap = new Map<string, string>();
  if (inviterIds.length) {
    const { data: inviters } = await supabase
      .from("users")
      .select("id, name")
      .in("id", inviterIds);
    for (const u of inviters ?? []) inviterMap.set(u.id, u.name);
  }

  const requests = rows
    .filter((r) => r.teams !== null)
    .map((r) => ({
      id: r.id,
      status: r.status,
      direction: r.direction,
      invited_by: r.invited_by,
      inviter_name: r.invited_by ? (inviterMap.get(r.invited_by) ?? null) : null,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      team: r.teams!,
    }));

  return NextResponse.json({ requests });
}
