import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

type EventRow = {
  id: string;
  type: string;
  date: string;
  status: string;
  price_per_player: number;
  venue_cost: number;
  venue_paid: number;
  is_public: boolean;
  venues: { id: string; name: string; photo_url: string | null } | null;
};

type AttendanceRow = {
  event_id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  users: { id: string; name: string; avatar_url: string | null } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();

  let role: "organizer" | "player" | "guest" = "guest";
  if (userId) {
    const { data: m } = await supabase
      .from("team_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (m) role = m.role as "organizer" | "player";
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const prevWindowStart = new Date(now.getTime() - 2 * WINDOW_DAYS * DAY_MS);

  // ─── Events (current + previous window) for trend; plus the next planned ──
  const { data: rawEvents } = await supabase
    .from("events")
    .select(
      "id, type, date, status, price_per_player, venue_cost, venue_paid, is_public, venues(id, name, photo_url)",
    )
    .eq("team_id", teamId)
    .gte("date", prevWindowStart.toISOString());

  const events = (rawEvents ?? []) as unknown as EventRow[];

  // ─── Members count (for attendance ratio) ───
  const { count: totalMembers } = await supabase
    .from("team_memberships")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  // ─── Next planned event (with photo) ───
  const planned = events
    .filter((e) => e.status === "planned" && new Date(e.date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let nextEventVisible: EventRow | undefined = planned[0];
  if (role === "guest" && nextEventVisible && !nextEventVisible.is_public) {
    nextEventVisible = planned.find((e) => e.is_public);
  }

  let nextEvent: {
    id: string;
    type: string;
    date: string;
    pricePerPlayer: number;
    venue: { id: string; name: string; photoUrl: string | null } | null;
    yesCount: number;
    totalMembers: number;
  } | null = null;

  if (nextEventVisible) {
    const { count: yesCount } = await supabase
      .from("event_attendances")
      .select("*", { count: "exact", head: true })
      .eq("event_id", nextEventVisible.id)
      .eq("vote", "yes");
    nextEvent = {
      id: nextEventVisible.id,
      type: nextEventVisible.type,
      date: nextEventVisible.date,
      pricePerPlayer: nextEventVisible.price_per_player,
      venue: nextEventVisible.venues
        ? {
            id: nextEventVisible.venues.id,
            name: nextEventVisible.venues.name,
            photoUrl: nextEventVisible.venues.photo_url ?? null,
          }
        : null,
      yesCount: yesCount ?? 0,
      totalMembers: totalMembers ?? 0,
    };
  }

  // ─── Activity 30d: completed events per week + attendance avg + trend ───
  const completedCurrent = events.filter(
    (e) =>
      e.status === "completed" &&
      new Date(e.date).getTime() >= windowStart.getTime() &&
      new Date(e.date).getTime() <= now.getTime(),
  );
  const completedPrev = events.filter(
    (e) =>
      e.status === "completed" &&
      new Date(e.date).getTime() >= prevWindowStart.getTime() &&
      new Date(e.date).getTime() < windowStart.getTime(),
  );

  // 4 weeks × count
  const eventsByWeek: { weekStart: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * 7 * DAY_MS);
    const weekStart = new Date(weekEnd.getTime() - 7 * DAY_MS);
    const count = completedCurrent.filter((e) => {
      const t = new Date(e.date).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    }).length;
    eventsByWeek.push({ weekStart: weekStart.toISOString(), count });
  }

  // Attendance % avg from yes-votes / totalMembers
  let attendanceAvg = 0;
  let attendancePrevAvg = 0;
  if (completedCurrent.length > 0 && (totalMembers ?? 0) > 0) {
    const ids = completedCurrent.map((e) => e.id);
    const { data: yesAtt } = await supabase
      .from("event_attendances")
      .select("event_id")
      .in("event_id", ids)
      .eq("vote", "yes");
    const byEvent = new Map<string, number>();
    for (const a of yesAtt ?? []) {
      byEvent.set(a.event_id, (byEvent.get(a.event_id) ?? 0) + 1);
    }
    const sum = completedCurrent.reduce(
      (s, e) => s + (byEvent.get(e.id) ?? 0) / (totalMembers ?? 1),
      0,
    );
    attendanceAvg = Math.round((sum / completedCurrent.length) * 100);
  }
  if (completedPrev.length > 0 && (totalMembers ?? 0) > 0) {
    const ids = completedPrev.map((e) => e.id);
    const { data: yesAtt } = await supabase
      .from("event_attendances")
      .select("event_id")
      .in("event_id", ids)
      .eq("vote", "yes");
    const byEvent = new Map<string, number>();
    for (const a of yesAtt ?? []) {
      byEvent.set(a.event_id, (byEvent.get(a.event_id) ?? 0) + 1);
    }
    const sum = completedPrev.reduce(
      (s, e) => s + (byEvent.get(e.id) ?? 0) / (totalMembers ?? 1),
      0,
    );
    attendancePrevAvg = Math.round((sum / completedPrev.length) * 100);
  }

  // ─── Top players: most attended in window ───
  let topPlayers: {
    id: string;
    name: string;
    avatarUrl: string | null;
    played: number;
    attendancePct: number;
  }[] = [];
  if (completedCurrent.length > 0) {
    const ids = completedCurrent.map((e) => e.id);
    const { data: rawAttended } = await supabase
      .from("event_attendances")
      .select("event_id, user_id, vote, attended, users(id, name, avatar_url)")
      .in("event_id", ids)
      .eq("attended", true);

    const byUser = new Map<
      string,
      { name: string; avatarUrl: string | null; played: number }
    >();
    for (const a of (rawAttended ?? []) as unknown as AttendanceRow[]) {
      if (!a.users) continue;
      const prev = byUser.get(a.user_id) ?? {
        name: a.users.name,
        avatarUrl: a.users.avatar_url ?? null,
        played: 0,
      };
      prev.played += 1;
      byUser.set(a.user_id, prev);
    }

    const totalEventsInWindow = completedCurrent.length;
    topPlayers = Array.from(byUser.entries())
      .map(([id, v]) => ({
        id,
        name: v.name,
        avatarUrl: v.avatarUrl,
        played: v.played,
        attendancePct: Math.round((v.played / totalEventsInWindow) * 100),
      }))
      .sort((a, b) => b.played - a.played)
      .slice(0, 3);
  }

  // ─── Finance 30d + flow by month (organizer only) ───
  let finance30d: {
    collected: number;
    venuePaid: number;
    netDelta: number;
    prevNetDelta: number;
  } | null = null;
  let financeFlowByMonth: { month: string; collected: number; venuePaid: number }[] | null = null;

  if (role === "organizer") {
    // 30-day window transactions
    const { data: tx } = await supabase
      .from("financial_transactions")
      .select("amount, created_at")
      .eq("team_id", teamId)
      .gte("created_at", prevWindowStart.toISOString());

    const txCurrent = (tx ?? []).filter(
      (t) => new Date(t.created_at).getTime() >= windowStart.getTime(),
    );
    const txPrev = (tx ?? []).filter(
      (t) => new Date(t.created_at).getTime() < windowStart.getTime(),
    );

    const collectedCur = txCurrent.reduce((s, t) => s + (t.amount ?? 0), 0);
    const collectedPrev = txPrev.reduce((s, t) => s + (t.amount ?? 0), 0);

    const venuePaidCur = completedCurrent.reduce(
      (s, e) => s + (e.venue_paid ?? 0),
      0,
    );
    const venuePaidPrev = completedPrev.reduce(
      (s, e) => s + (e.venue_paid ?? 0),
      0,
    );

    finance30d = {
      collected: collectedCur,
      venuePaid: venuePaidCur,
      netDelta: collectedCur - venuePaidCur,
      prevNetDelta: collectedPrev - venuePaidPrev,
    };

    // 6-month flow
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const { data: txSix } = await supabase
      .from("financial_transactions")
      .select("amount, created_at")
      .eq("team_id", teamId)
      .gte("created_at", sixMonthsAgo.toISOString());

    const { data: completedSix } = await supabase
      .from("events")
      .select("date, venue_paid")
      .eq("team_id", teamId)
      .eq("status", "completed")
      .gte("date", sixMonthsAgo.toISOString());

    financeFlowByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = mStart.toISOString().slice(0, 7);

      const mCollected = (txSix ?? [])
        .filter((t) => {
          const ts = new Date(t.created_at).getTime();
          return ts >= mStart.getTime() && ts < mEnd.getTime();
        })
        .reduce((s, t) => s + (t.amount ?? 0), 0);

      const mVenuePaid = (completedSix ?? [])
        .filter((e) => {
          const ts = new Date(e.date).getTime();
          return ts >= mStart.getTime() && ts < mEnd.getTime();
        })
        .reduce((s, e) => s + ((e as { venue_paid: number }).venue_paid ?? 0), 0);

      financeFlowByMonth.push({ month: monthKey, collected: mCollected, venuePaid: mVenuePaid });
    }
  }

  return NextResponse.json({
    nextEvent,
    activity: {
      eventsByWeek,
      eventsCount: completedCurrent.length,
      eventsCountPrev: completedPrev.length,
      attendanceAvg,
      attendancePrevAvg,
    },
    topPlayers,
    finance30d,
    financeFlowByMonth,
  });
}
