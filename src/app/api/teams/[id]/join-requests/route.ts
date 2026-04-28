import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type JoinRequestRow = {
  id: string;
  user_id: string;
  status: string;
  direction: "player_to_team" | "team_to_player";
  invited_by: string | null;
  created_at: string;
  users: {
    id: string;
    name: string;
    city: string | null;
    avatar_url: string | null;
  } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rawRequests, error } = await supabase
    .from("join_requests")
    .select(
      "id, user_id, status, direction, invited_by, created_at, users(id, name, city, avatar_url)",
    )
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Join requests fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (rawRequests ?? []) as unknown as JoinRequestRow[];
  const valid = rows.filter((r) => r.users !== null);

  const incoming = valid
    .filter((r) => r.direction === "player_to_team")
    .map((r) => ({
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      user: r.users!,
    }));

  const outgoing = valid
    .filter((r) => r.direction === "team_to_player")
    .map((r) => ({
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      invited_by: r.invited_by,
      user: r.users!,
    }));

  return NextResponse.json({ incoming, outgoing });
}
