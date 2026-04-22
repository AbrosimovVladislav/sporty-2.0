import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { getExpectedAmount } from "@/lib/finances";
import { sendMessage, buildEventDeepLink } from "@/lib/telegram-bot";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyMembers(supabase: any, teamId: string, event: any) {
  const [{ data: members }, { data: team }] = await Promise.all([
    supabase
      .from("team_memberships")
      .select("user_id, users(telegram_id)")
      .eq("team_id", teamId),
    supabase.from("teams").select("name").eq("id", teamId).single(),
  ]);

  if (!members?.length) return;

  let venueName: string | null = null;
  if (event.venue_id) {
    const { data: venue } = await supabase
      .from("venues")
      .select("name")
      .eq("id", event.venue_id)
      .single();
    venueName = venue?.name ?? null;
  }

  const deepLink = buildEventDeepLink(teamId, event.id);
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
    inline_keyboard: [[{ text: "Открыть в Sporty", url: deepLink }]],
  };

  await Promise.allSettled(
    members
      .filter((m: { users: { telegram_id: number } | null }) => m.users?.telegram_id)
      .map((m: { users: { telegram_id: number } }) =>
        sendMessage(m.users.telegram_id, text, { reply_markup: replyMarkup })
      )
  );
}

// GET — list team events
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();

  let isGuestAccess = true;
  if (userId) {
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (membership) isGuestAccess = false;
  }

  let eventsQuery = supabase
    .from("events")
    .select("id, team_id, type, date, price_per_player, min_players, description, status, venue_cost, venue_paid, is_public, created_by, created_at, venues(id, name, address)")
    .eq("team_id", teamId)
    .order("date", { ascending: false });

  if (isGuestAccess) {
    eventsQuery = eventsQuery.eq("is_public", true);
  }

  const { data, error } = await eventsQuery;

  if (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const events = (data ?? []) as unknown as EventWithVenue[];
  const eventIds = events.map((e) => e.id);

  // Batch fetch attendances and transactions for all events
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

  const attendances = (attRaw ?? []) as unknown as AttendanceRow[];
  const byEvent = new Map<string, AttendanceRow[]>();
  for (const a of attendances) {
    const list = byEvent.get(a.event_id) ?? [];
    list.push(a);
    byEvent.set(a.event_id, list);
  }

  const txByEvent = new Map<string, number>();
  for (const tx of (txRaw ?? []) as unknown as TransactionRow[]) {
    txByEvent.set(tx.event_id, (txByEvent.get(tx.event_id) ?? 0) + tx.amount);
  }

  const enriched = events.map((e) => {
    const list = byEvent.get(e.id) ?? [];
    const yesCount = list.filter((a) => a.vote === "yes").length;
    const noCount = list.filter((a) => a.vote === "no").length;
    const myVote = userId
      ? (list.find((a) => a.user_id === userId)?.vote ?? null)
      : null;

    const expectedCollected = list.reduce(
      (sum, a) => sum + getExpectedAmount(a, e.price_per_player),
      0,
    );
    const actualCollected = txByEvent.get(e.id) ?? 0;

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
      yesCount,
      noCount,
      myVote,
      expectedCollected,
      actualCollected,
    };
  });

  return NextResponse.json({ events: enriched });
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

  // Pick an existing venue, or create a new one from the form
  let venueId: string | null = venue_id ?? null;
  if (!venueId && venue && venue.name && venue.address) {
    const { data: v, error: vErr } = await supabase
      .from("venues")
      .insert({
        name: venue.name,
        address: venue.address,
        city: venue.city ?? "",
        district_id: venue.district_id ?? null,
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
