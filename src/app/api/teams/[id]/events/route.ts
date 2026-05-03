import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { sendMessage, buildEventUrl } from "@/lib/telegram-bot";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { decodeCursor, encodeCursor, keysetClause } from "@/lib/cursor";

type EventWithVenue = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  status: string;
  venue_cost: number;
  venue_paid: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  venues: { id: string; name: string; address: string } | null;
};

type AttendanceRow = {
  event_id: string;
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
};

type TransactionRow = {
  event_id: string;
  amount: number;
};

type NotifyEvent = {
  id: string;
  type: string;
  date: string;
  venue_id: string | null;
};

type MemberWithTelegram = {
  user_id: string;
  users: { telegram_id: number | null } | null;
};

async function notifyMembers(
  supabase: ReturnType<typeof getServiceClient>,
  teamId: string,
  event: NotifyEvent,
) {
  const [{ data: rawMembers }, { data: team }] = await Promise.all([
    supabase
      .from("team_memberships")
      .select("user_id, users(telegram_id)")
      .eq("team_id", teamId),
    supabase.from("teams").select("name").eq("id", teamId).single(),
  ]);

  const members = (rawMembers ?? []) as unknown as MemberWithTelegram[];
  if (!members.length) return;

  let venueName: string | null = null;
  if (event.venue_id) {
    const { data: venue } = await supabase
      .from("venues")
      .select("name")
      .eq("id", event.venue_id)
      .single();
    venueName = venue?.name ?? null;
  }

  const eventUrl = buildEventUrl(teamId, event.id);
  const typeLabel = EVENT_TYPE_LABEL[event.type] ?? event.type;
  const dateStr = new Date(event.date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  });

  let text = `📅 <b>${typeLabel}`;
  if (team?.name) text += ` · ${team.name}`;
  text += `</b>\n${dateStr}`;
  if (venueName) text += `\n📍 ${venueName}`;

  const replyMarkup = {
    inline_keyboard: [[{ text: "Открыть в Sporty", web_app: { url: eventUrl } }]],
  };

  await Promise.allSettled(
    members
      .map((m) => m.users?.telegram_id)
      .filter((id): id is number => typeof id === "number")
      .map((id) => sendMessage(id, text, { reply_markup: replyMarkup })),
  );
}

// GET — list team events with cursor pagination.
// Params: userId, direction=upcoming|past, limit (default 20, max 50), cursor.
// Server returns aggregates (yes/no counts, collected) — never raw attendances/transactions.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const direction =
    searchParams.get("direction") === "past" ? "past" : "upcoming";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    50,
  );
  const cursor = decodeCursor(searchParams.get("cursor"));

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // Membership probe runs in parallel with the page query.
  const membershipPromise = userId
    ? supabase
        .from("team_memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  let pageQuery = supabase
    .from("events")
    .select(
      "id, team_id, type, date, price_per_player, min_players, description, status, venue_cost, venue_paid, is_public, created_by, created_at, venues(id, name, address)",
    )
    .eq("team_id", teamId);

  if (direction === "upcoming") {
    pageQuery = pageQuery
      .gte("date", now)
      .order("date", { ascending: true })
      .order("id", { ascending: true });
    if (cursor) pageQuery = pageQuery.or(keysetClause("date", cursor, "asc"));
  } else {
    pageQuery = pageQuery
      .lt("date", now)
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (cursor) pageQuery = pageQuery.or(keysetClause("date", cursor, "desc"));
  }

  // Over-fetch by 1 to detect "has next page" without an extra round-trip.
  pageQuery = pageQuery.limit(limit + 1);

  const [{ data: membership }, { data, error }] = await Promise.all([
    membershipPromise,
    pageQuery,
  ]);

  if (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const isGuestAccess = !membership;
  const rows = (data ?? []) as unknown as EventWithVenue[];
  const visible = isGuestAccess ? rows.filter((e) => e.is_public) : rows;

  const hasMore = visible.length > limit;
  const pageEvents = hasMore ? visible.slice(0, limit) : visible;
  const eventIds = pageEvents.map((e) => e.id);

  // Aggregate attendances and transactions for the current page only.
  const [{ data: attRaw }, { data: txRaw }] = await Promise.all([
    eventIds.length
      ? supabase
          .from("event_attendances")
          .select("event_id, user_id, vote, attended")
          .in("event_id", eventIds)
      : Promise.resolve({ data: [] as AttendanceRow[] }),
    eventIds.length
      ? supabase
          .from("financial_transactions")
          .select("event_id, amount")
          .in("event_id", eventIds)
          .eq("type", "event_payment")
      : Promise.resolve({ data: [] as TransactionRow[] }),
  ]);

  type AggBucket = {
    yes: number;
    no: number;
    attended: number;
    myVote: "yes" | "no" | null;
  };
  const agg = new Map<string, AggBucket>();
  for (const e of pageEvents) {
    agg.set(e.id, { yes: 0, no: 0, attended: 0, myVote: null });
  }
  for (const a of (attRaw ?? []) as unknown as AttendanceRow[]) {
    const b = agg.get(a.event_id);
    if (!b) continue;
    if (a.vote === "yes") b.yes++;
    if (a.vote === "no") b.no++;
    if (a.attended === true) b.attended++;
    if (userId && a.user_id === userId) b.myVote = a.vote;
  }

  const txByEvent = new Map<string, number>();
  for (const tx of (txRaw ?? []) as unknown as TransactionRow[]) {
    txByEvent.set(tx.event_id, (txByEvent.get(tx.event_id) ?? 0) + tx.amount);
  }

  const enriched = pageEvents.map((e) => {
    const b = agg.get(e.id) ?? { yes: 0, no: 0, attended: 0, myVote: null };
    return {
      id: e.id,
      type: e.type,
      date: e.date,
      price_per_player: e.price_per_player,
      min_players: e.min_players,
      description: e.description,
      status: e.status,
      venue_cost: e.venue_cost,
      venue_paid: e.venue_paid,
      is_public: e.is_public,
      venue: e.venues,
      yesCount: b.yes,
      noCount: b.no,
      myVote: b.myVote,
      expectedCollected: b.attended * Number(e.price_per_player ?? 0),
      actualCollected: txByEvent.get(e.id) ?? 0,
    };
  });

  const last = pageEvents[pageEvents.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ v: last.date, id: last.id }) : null;

  return NextResponse.json({ events: enriched, nextCursor });
}

// POST — create event (organizer only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { userId, type, date, price_per_player, min_players, description, venue, venue_id, venue_cost, is_public } = body;

  if (!userId || !type || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify caller is organizer
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pick an existing venue, or create a new one from the form.
  // For new venues, save `venue_cost` as `default_cost` so future events can auto-fill.
  let venueId: string | null = venue_id ?? null;
  if (!venueId && venue && venue.name && venue.address) {
    const { data: v, error: vErr } = await supabase
      .from("venues")
      .insert({
        name: venue.name,
        address: venue.address,
        city: venue.city ?? "",
        district_id: venue.district_id ?? null,
        default_cost: venue_cost != null ? Number(venue_cost) : null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (vErr) {
      console.error("Venue create error:", vErr);
      return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
    }
    venueId = v.id;
  }

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .insert({
      team_id: teamId,
      venue_id: venueId,
      type,
      date,
      price_per_player: price_per_player ?? 0,
      min_players: min_players ?? 1,
      description: description ?? null,
      venue_cost: venue_cost != null ? Number(venue_cost) : 0,
      is_public: is_public === true,
      created_by: userId,
    })
    .select()
    .single();

  if (eventErr) {
    console.error("Event create error:", eventErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Notify team members via Telegram (fire-and-forget)
  notifyMembers(supabase, teamId, event).catch((e) =>
    console.error("Notify members error:", e)
  );

  return NextResponse.json({ event }, { status: 201 });
}
