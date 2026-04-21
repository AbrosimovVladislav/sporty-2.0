import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type JoinRequestWithUser = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    city: string | null;
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

  // Verify caller is an organizer of this team
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
    .select("id, user_id, status, created_at, users(id, name, city)")
    .eq("team_id", teamId)
    .eq("direction", "player_to_team")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Join requests fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const requests = (rawRequests ?? []) as unknown as JoinRequestWithUser[];
  const result = requests
    .filter((r) => r.users !== null)
    .map((r) => ({
      id: r.id,
      user_id: r.user_id,
      created_at: r.created_at,
      user: r.users!,
    }));

  return NextResponse.json({ requests: result });
}
