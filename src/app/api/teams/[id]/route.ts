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
    position: string | null;
    skill_level: string | null;
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
    .select("id, user_id, role, joined_at, users(id, name, city, sport, position, skill_level)")
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

  // If guest, check if they have a pending/rejected player_to_team request
  let joinRequestStatus: "none" | "pending" | "rejected" = "none";
  let joinRequestId: string | null = null;
  let joinRequestCooldownUntil: string | null = null;
  if (currentRole === "guest" && userId) {
    const { data: jr } = await supabase
      .from("join_requests")
      .select("id, status, resolved_at")
      .eq("user_id", userId)
      .eq("team_id", id)
      .eq("direction", "player_to_team")
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (jr) {
      joinRequestStatus = jr.status as "pending" | "rejected";
      joinRequestId = jr.status === "pending" ? jr.id : null;
      if (jr.status === "rejected" && jr.resolved_at) {
        const resolvedAt = new Date(jr.resolved_at);
        const until = new Date(
          resolvedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        if (until.getTime() > Date.now()) {
          joinRequestCooldownUntil = until.toISOString();
        }
      }
    }
  }

  // If organizer, count pending player_to_team requests (not outgoing invites)
  let pendingRequestsCount = 0;
  if (currentRole === "organizer") {
    const { count } = await supabase
      .from("join_requests")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id)
      .eq("direction", "player_to_team")
      .eq("status", "pending");
    pendingRequestsCount = count ?? 0;
  }

  // Team event stats
  const { count: completedEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("team_id", id)
    .eq("status", "completed");

  const { count: plannedEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("team_id", id)
    .eq("status", "planned");

  // Organizer-only: total debt across all players
  let totalPlayersDebt: number | null = null;
  if (currentRole === "organizer") {
    const { data: completedEvents } = await supabase
      .from("events")
      .select("id, price_per_player")
      .eq("team_id", id)
      .eq("status", "completed");

    const completedIds = (completedEvents ?? []).map((e) => e.id);
    const priceByEvent = new Map((completedEvents ?? []).map((e) => [e.id, e.price_per_player as number]));

    const playerExpected = new Map<string, number>();
    if (completedIds.length > 0) {
      const { data: attendances } = await supabase
        .from("event_attendances")
        .select("user_id, event_id")
        .in("event_id", completedIds)
        .eq("attended", true);
      for (const a of (attendances ?? []) as { user_id: string; event_id: string }[]) {
        const price = priceByEvent.get(a.event_id) ?? 0;
        playerExpected.set(a.user_id, (playerExpected.get(a.user_id) ?? 0) + price);
      }
    }

    const { data: transactions } = await supabase
      .from("financial_transactions")
      .select("player_id, amount")
      .eq("team_id", id);
    const playerPaid = new Map<string, number>();
    for (const tx of (transactions ?? []) as { player_id: string; amount: number }[]) {
      playerPaid.set(tx.player_id, (playerPaid.get(tx.player_id) ?? 0) + tx.amount);
    }

    let debt = 0;
    const allIds = new Set([...playerExpected.keys(), ...playerPaid.keys()]);
    for (const uid of allIds) {
      const delta = (playerExpected.get(uid) ?? 0) - (playerPaid.get(uid) ?? 0);
      if (delta > 0) debt += delta;
    }
    totalPlayersDebt = debt;
  }

  const teamStats = {
    completedEvents: completedEventsCount ?? 0,
    plannedEvents: plannedEventsCount ?? 0,
    totalPlayersDebt,
  };

  return NextResponse.json({
    team,
    members,
    currentRole,
    joinRequestStatus,
    joinRequestId,
    joinRequestCooldownUntil,
    pendingRequestsCount,
    teamStats,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId, looking_for_players } = await req.json();

  if (!userId || typeof looking_for_players !== "boolean") {
    return NextResponse.json({ error: "userId and looking_for_players required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify caller is organizer
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", id)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("teams")
    .update({ looking_for_players })
    .eq("id", id);

  if (error) {
    console.error("Team update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
