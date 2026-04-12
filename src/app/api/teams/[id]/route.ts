import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type MembershipWithUser = {
  id: string;
  user_id: string;
  role: "organizer" | "player";
  joined_at: string;
  users: {
    id: string;
    name: string;
    city: string | null;
    sport: string | null;
  } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (teamError) {
    console.error("Team fetch error:", teamError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const { data: rawMemberships, error: membersError } = await supabase
    .from("team_memberships")
    .select("id, user_id, role, joined_at, users(id, name, city, sport)")
    .eq("team_id", id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Memberships fetch error:", membersError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const memberships = (rawMemberships ?? []) as unknown as MembershipWithUser[];

  let currentRole: "organizer" | "player" | "guest" = "guest";
  if (userId) {
    const mine = memberships.find((m) => m.user_id === userId);
    if (mine) currentRole = mine.role;
  }

  const members = memberships
    .filter((m) => m.users !== null)
    .map((m) => ({
      id: m.id,
      role: m.role,
      joined_at: m.joined_at,
      user: m.users!,
    }));

  // If guest, check if they have a pending/rejected join request
  let joinRequestStatus: "none" | "pending" | "rejected" = "none";
  if (currentRole === "guest" && userId) {
    const { data: jr } = await supabase
      .from("join_requests")
      .select("status")
      .eq("user_id", userId)
      .eq("team_id", id)
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (jr) joinRequestStatus = jr.status as "pending" | "rejected";
  }

  // If organizer, count pending join requests
  let pendingRequestsCount = 0;
  if (currentRole === "organizer") {
    const { count } = await supabase
      .from("join_requests")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id)
      .eq("status", "pending");
    pendingRequestsCount = count ?? 0;
  }

  return NextResponse.json({ team, members, currentRole, joinRequestStatus, pendingRequestsCount });
}
