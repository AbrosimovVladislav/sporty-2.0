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
    position: string[] | null;
    skill_level: string | null;
    avatar_url: string | null;
  } | null;
};

type CompletedEvent = { id: string; price_per_player: number };
type Transaction = { player_id: string; amount: number };
type Attendance = { user_id: string; event_id: string };
type JoinRequestRow = { id: string; status: string; resolved_at: string | null };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();

  // Phase 1 — все запросы, не требующие предыдущих результатов, параллельно.
  const [
    { data: team, error: teamError },
    { data: rawMemberships, error: membersError },
    { count: completedEventsCount },
    { count: plannedEventsCount },
    { data: completedEvents },
    { data: transactions },
    pendingRequestsRes,
    guestJoinReqRes,
  ] = await Promise.all([
    supabase.from("teams").select().eq("id", id).maybeSingle(),
    supabase
      .from("team_memberships")
      .select("id, user_id, role, joined_at, users(id, name, city, sport, position, skill_level, avatar_url)")
      .eq("team_id", id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id)
      .eq("status", "completed"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id)
      .eq("status", "planned"),
    supabase
      .from("events")
      .select("id, price_per_player")
      .eq("team_id", id)
      .eq("status", "completed"),
    supabase
      .from("financial_transactions")
      .select("player_id, amount")
      .eq("team_id", id),
    supabase
      .from("join_requests")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id)
      .eq("direction", "player_to_team")
      .eq("status", "pending"),
    userId
      ? supabase
          .from("join_requests")
          .select("id, status, resolved_at")
          .eq("user_id", userId)
          .eq("team_id", id)
          .eq("direction", "player_to_team")
          .in("status", ["pending", "rejected"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as JoinRequestRow | null }),
  ]);

  if (teamError) {
    console.error("Team fetch error:", teamError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

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

  // Guest join-request status — берём из уже выполненного запроса.
  let joinRequestStatus: "none" | "pending" | "rejected" = "none";
  let joinRequestId: string | null = null;
  let joinRequestCooldownUntil: string | null = null;
  if (currentRole === "guest" && userId) {
    const jr = guestJoinReqRes?.data ?? null;
    if (jr) {
      joinRequestStatus = jr.status as "pending" | "rejected";
      joinRequestId = jr.status === "pending" ? jr.id : null;
      if (jr.status === "rejected" && jr.resolved_at) {
        const resolvedAt = new Date(jr.resolved_at);
        const until = new Date(resolvedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (until.getTime() > Date.now()) {
          joinRequestCooldownUntil = until.toISOString();
        }
      }
    }
  }

  const pendingRequestsCount = currentRole === "organizer" ? (pendingRequestsRes.count ?? 0) : 0;

  // Phase 2 — посчитать долг игроков. Зависит от completedEvents и transactions.
  let totalPlayersDebt: number | null = null;
  if (currentRole === "organizer") {
    const completedList = (completedEvents ?? []) as CompletedEvent[];
    const txs = (transactions ?? []) as Transaction[];
    const completedIds = completedList.map((e) => e.id);
    const priceByEvent = new Map(completedList.map((e) => [e.id, e.price_per_player]));

    let attendances: Attendance[] = [];
    if (completedIds.length > 0) {
      const { data: rows } = await supabase
        .from("event_attendances")
        .select("user_id, event_id")
        .in("event_id", completedIds)
        .eq("attended", true);
      attendances = (rows ?? []) as Attendance[];
    }

    const playerExpected = new Map<string, number>();
    for (const a of attendances) {
      const price = priceByEvent.get(a.event_id) ?? 0;
      playerExpected.set(a.user_id, (playerExpected.get(a.user_id) ?? 0) + price);
    }

    const playerPaid = new Map<string, number>();
    for (const tx of txs) {
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
  const body = await req.json();
  const { userId, ...rawPatch } = body as Record<string, unknown>;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const update: {
    looking_for_players?: boolean;
    name?: string;
    sport?: string;
    city?: string;
    district_id?: string | null;
    description?: string | null;
  } = {};
  if (typeof rawPatch.looking_for_players === "boolean") {
    update.looking_for_players = rawPatch.looking_for_players;
  }
  if (typeof rawPatch.name === "string") {
    const trimmed = rawPatch.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    update.name = trimmed;
  }
  if (typeof rawPatch.sport === "string" && rawPatch.sport.trim()) {
    update.sport = rawPatch.sport.trim();
  }
  if (typeof rawPatch.city === "string" && rawPatch.city.trim()) {
    update.city = rawPatch.city.trim();
  }
  if (rawPatch.district_id === null || typeof rawPatch.district_id === "string") {
    update.district_id = (rawPatch.district_id as string | null) || null;
  }
  if (rawPatch.description === null || typeof rawPatch.description === "string") {
    update.description = (rawPatch.description as string | null)?.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

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
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("Team update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
