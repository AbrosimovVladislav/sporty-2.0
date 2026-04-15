import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { getExpectedAmount, getPaidAmount } from "@/lib/finances";

type EventRow = {
  id: string;
  type: string;
  date: string;
  status: string;
  price_per_player: number;
  venue_cost: number;
  venue_paid: number;
  venues: { id: string; name: string } | null;
};

type AttendanceRow = {
  event_id: string;
  user_id: string;
  attended: boolean | null;
  paid: boolean | null;
  paid_amount: number | null;
  users: { id: string; name: string } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
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

  const { data: rawEvents, error: eventsErr } = await supabase
    .from("events")
    .select("id, type, date, status, price_per_player, venue_cost, venue_paid, venues(id, name)")
    .eq("team_id", teamId)
    .order("date", { ascending: false });

  if (eventsErr) {
    console.error("Finances events fetch error:", eventsErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const events = (rawEvents ?? []) as unknown as EventRow[];
  const completedEventIds = events.filter((e) => e.status === "completed").map((e) => e.id);

  let attendances: AttendanceRow[] = [];
  if (completedEventIds.length > 0) {
    const { data: rawAtt, error: attErr } = await supabase
      .from("event_attendances")
      .select("event_id, user_id, attended, paid, paid_amount, users(id, name)")
      .in("event_id", completedEventIds);

    if (attErr) {
      console.error("Finances attendances fetch error:", attErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    attendances = (rawAtt ?? []) as unknown as AttendanceRow[];
  }

  const priceByEvent = new Map<string, number>();
  for (const e of events) priceByEvent.set(e.id, e.price_per_player);

  let collected = 0;
  let expected = 0;
  const playerBalances = new Map<
    string,
    { name: string; expected: number; paid: number }
  >();

  for (const a of attendances) {
    const price = priceByEvent.get(a.event_id) ?? 0;
    const exp = getExpectedAmount(a, price);
    const pay = getPaidAmount(a, price);
    collected += pay;
    expected += exp;

    if (!a.users) continue;
    const prev = playerBalances.get(a.user_id) ?? { name: a.users.name, expected: 0, paid: 0 };
    prev.expected += exp;
    prev.paid += pay;
    playerBalances.set(a.user_id, prev);
  }

  // Per-player deltas: positive = player owes team, negative = team owes player
  const debtors: { userId: string; name: string; amount: number }[] = [];
  const creditors: { userId: string; name: string; amount: number }[] = [];
  let playersDebt = 0;
  let playersOverpaid = 0;

  for (const [uid, b] of playerBalances) {
    const delta = b.expected - b.paid;
    if (delta > 0) {
      debtors.push({ userId: uid, name: b.name, amount: delta });
      playersDebt += delta;
    } else if (delta < 0) {
      creditors.push({ userId: uid, name: b.name, amount: -delta });
      playersOverpaid += -delta;
    }
  }
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const venueCostTotal = events.reduce((s, e) => s + (e.venue_cost ?? 0), 0);
  const venuePaidTotal = events.reduce((s, e) => s + (e.venue_paid ?? 0), 0);
  const venueOutstanding = Math.max(0, venueCostTotal - venuePaidTotal);

  const cash = collected - venuePaidTotal;
  const realBalance = cash - venueOutstanding - playersOverpaid + playersDebt;

  const venueEvents = events
    .filter((e) => (e.venue_cost ?? 0) > 0)
    .map((e) => ({
      eventId: e.id,
      type: e.type,
      date: e.date,
      venueName: e.venues?.name ?? null,
      cost: e.venue_cost,
      paid: e.venue_paid,
    }));

  return NextResponse.json({
    metrics: {
      collected,
      expected,
      venueCostTotal,
      venuePaidTotal,
      venueOutstanding,
      playersDebt,
      playersOverpaid,
      cash,
      realBalance,
    },
    debtors,
    creditors,
    venueEvents,
  });
}
