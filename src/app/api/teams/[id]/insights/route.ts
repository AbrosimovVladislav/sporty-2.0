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

type TxRow = { amount: number; created_at: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const prevWindowStart = new Date(now.getTime() - 2 * WINDOW_DAYS * DAY_MS);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Берём нижнюю границу выборки = min(prevWindow, sixMonthsAgo) чтобы один events-fetch
  // покрыл и activity-окно (30d + prev 30d), и flow-by-month (6 месяцев).
  const eventsLowerBound = sixMonthsAgo < prevWindowStart ? sixMonthsAgo : prevWindowStart;

  // Phase 1 — параллельно: membership, events(6mo+), members count, transactions(6mo).
  // Транзакции грузим спекулятивно — если роль не organizer, отбросим. Объём маленький.
  const [
    { data: membershipRow },
    { data: rawEvents },
    { count: totalMembers },
    { data: rawTx },
  ] = await Promise.all([
    userId
      ? supabase
          .from("team_memberships")
          .select("role")
          .eq("user_id", userId)
          .eq("team_id", teamId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("events")
      .select(
        "id, type, date, status, price_per_player, venue_cost, venue_paid, is_public, venues(id, name, photo_url)",
      )
      .eq("team_id", teamId)
      .gte("date", eventsLowerBound.toISOString()),
    supabase
      .from("team_memberships")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId),
    supabase
      .from("financial_transactions")
      .select("amount, created_at")
      .eq("team_id", teamId)
      .gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  const role: "organizer" | "player" | "guest" =
    membershipRow ? (membershipRow.role as "organizer" | "player") : "guest";

  const events = (rawEvents ?? []) as unknown as EventRow[];

  // Next event preview.
  const planned = events
    .filter((e) => e.status === "planned" && new Date(e.date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let nextEventVisible: EventRow | undefined = planned[0];
  if (role === "guest" && nextEventVisible && !nextEventVisible.is_public) {
    nextEventVisible = planned.find((e) => e.is_public);
  }

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

  // Phase 2 — параллельно: один батч-фетч attendances для всех нужных событий.
  // Покрывает: yes-counts для current/prev windows, yesCount для nextEvent, top players (attended).
  const attEventIds = new Set<string>([
    ...completedCurrent.map((e) => e.id),
    ...completedPrev.map((e) => e.id),
  ]);
  if (nextEventVisible) attEventIds.add(nextEventVisible.id);

  let attendances: AttendanceRow[] = [];
  if (attEventIds.size > 0) {
    const { data } = await supabase
      .from("event_attendances")
      .select("event_id, user_id, vote, attended, users(id, name, avatar_url)")
      .in("event_id", Array.from(attEventIds));
    attendances = (data ?? []) as unknown as AttendanceRow[];
  }

  // Index: yes-votes per event.
  const yesByEvent = new Map<string, number>();
  for (const a of attendances) {
    if (a.vote === "yes") yesByEvent.set(a.event_id, (yesByEvent.get(a.event_id) ?? 0) + 1);
  }

  // Next event payload.
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
      yesCount: yesByEvent.get(nextEventVisible.id) ?? 0,
      totalMembers: totalMembers ?? 0,
    };
  }

  // 4 weeks × count.
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

  const computeAttendanceAvg = (eventList: EventRow[]) => {
    if (eventList.length === 0 || (totalMembers ?? 0) === 0) return 0;
    const sum = eventList.reduce(
      (s, e) => s + (yesByEvent.get(e.id) ?? 0) / (totalMembers ?? 1),
      0,
    );
    return Math.round((sum / eventList.length) * 100);
  };
  const attendanceAvg = computeAttendanceAvg(completedCurrent);
  const attendancePrevAvg = computeAttendanceAvg(completedPrev);

  // Top players: attended in current window.
  const topPlayers = (() => {
    if (completedCurrent.length === 0) return [];
    const currentIds = new Set(completedCurrent.map((e) => e.id));
    const byUser = new Map<
      string,
      { name: string; avatarUrl: string | null; played: number }
    >();
    for (const a of attendances) {
      if (!a.attended || !a.users) continue;
      if (!currentIds.has(a.event_id)) continue;
      const prev = byUser.get(a.user_id) ?? {
        name: a.users.name,
        avatarUrl: a.users.avatar_url ?? null,
        played: 0,
      };
      prev.played += 1;
      byUser.set(a.user_id, prev);
    }
    const totalEventsInWindow = completedCurrent.length;
    return Array.from(byUser.entries())
      .map(([id, v]) => ({
        id,
        name: v.name,
        avatarUrl: v.avatarUrl,
        played: v.played,
        attendancePct: Math.round((v.played / totalEventsInWindow) * 100),
      }))
      .sort((a, b) => b.played - a.played)
      .slice(0, 3);
  })();

  // Finance (organizer-only).
  let finance30d: {
    collected: number;
    venuePaid: number;
    netDelta: number;
    prevNetDelta: number;
  } | null = null;
  let financeFlowByMonth: { month: string; collected: number; venuePaid: number }[] | null = null;

  if (role === "organizer") {
    const txSix = (rawTx ?? []) as TxRow[];

    const txCurrent = txSix.filter(
      (t) => new Date(t.created_at).getTime() >= windowStart.getTime(),
    );
    const txPrev = txSix.filter((t) => {
      const ts = new Date(t.created_at).getTime();
      return ts >= prevWindowStart.getTime() && ts < windowStart.getTime();
    });

    const collectedCur = txCurrent.reduce((s, t) => s + (t.amount ?? 0), 0);
    const collectedPrev = txPrev.reduce((s, t) => s + (t.amount ?? 0), 0);

    const venuePaidCur = completedCurrent.reduce((s, e) => s + (e.venue_paid ?? 0), 0);
    const venuePaidPrev = completedPrev.reduce((s, e) => s + (e.venue_paid ?? 0), 0);

    finance30d = {
      collected: collectedCur,
      venuePaid: venuePaidCur,
      netDelta: collectedCur - venuePaidCur,
      prevNetDelta: collectedPrev - venuePaidPrev,
    };

    // 6-month flow по месяцам — события уже в `events` (fetch с lower bound = sixMonthsAgo).
    const completedSix = events.filter((e) => e.status === "completed");
    financeFlowByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = mStart.toISOString().slice(0, 7);

      const mCollected = txSix
        .filter((t) => {
          const ts = new Date(t.created_at).getTime();
          return ts >= mStart.getTime() && ts < mEnd.getTime();
        })
        .reduce((s, t) => s + (t.amount ?? 0), 0);

      const mVenuePaid = completedSix
        .filter((e) => {
          const ts = new Date(e.date).getTime();
          return ts >= mStart.getTime() && ts < mEnd.getTime();
        })
        .reduce((s, e) => s + (e.venue_paid ?? 0), 0);

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
