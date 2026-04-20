import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

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

  // Fetch all events
  const { data: rawEvents, error: eventsErr } = await supabase
    .from("events")
    .select("id, type, date, status, price_per_player, venue_cost, venue_paid, venues(id, name)")
    .eq("team_id", teamId)
    .order("date", { ascending: false });

  if (eventsErr) return NextResponse.json({ error: "Database error" }, { status: 500 });

  const events = (rawEvents ?? []) as unknown as EventRow[];
  const completedEventIds = events.filter((e) => e.status === "completed").map((e) => e.id);

  // Expected per player (attended completed events)
  const playerExpected = new Map<string, { name: string; expected: number }>();
  if (completedEventIds.length > 0) {
    const { data: rawAtt } = await supabase
      .from("event_attendances")
      .select("user_id, event_id, attended, users(id, name)")
      .in("event_id", completedEventIds)
      .eq("attended", true);

    const priceByEvent = new Map(events.map((e) => [e.id, e.price_per_player]));

    for (const a of rawAtt ?? []) {
      const att = a as unknown as { user_id: string; event_id: string; users: { name: string } | null };
      if (!att.users) continue;
      const price = priceByEvent.get(att.event_id) ?? 0;
      const prev = playerExpected.get(att.user_id) ?? { name: att.users.name, expected: 0 };
      prev.expected += price;
      playerExpected.set(att.user_id, prev);
    }
  }

  // Paid per player (all transactions)
  const { data: rawTx } = await supabase
    .from("financial_transactions")
    .select("player_id, amount, users!financial_transactions_player_id_fkey(id, name)")
    .eq("team_id", teamId);

  const playerPaid = new Map<string, { name: string; paid: number }>();
  for (const tx of rawTx ?? []) {
    const t = tx as unknown as { player_id: string; amount: number; users: { name: string } | null };
    const prev = playerPaid.get(t.player_id) ?? { name: t.users?.name ?? "", paid: 0 };
    prev.paid += t.amount;
    playerPaid.set(t.player_id, prev);
  }

  // Merge: all player ids from both maps
  const allPlayerIds = new Set([...playerExpected.keys(), ...playerPaid.keys()]);
  const debtors: { userId: string; name: string; amount: number }[] = [];
  const creditors: { userId: string; name: string; amount: number }[] = [];
  let collected = 0;
  let expected = 0;
  let playersDebt = 0;
  let playersOverpaid = 0;

  for (const uid of allPlayerIds) {
    const exp = playerExpected.get(uid)?.expected ?? 0;
    const paid = playerPaid.get(uid)?.paid ?? 0;
    const name = playerExpected.get(uid)?.name ?? playerPaid.get(uid)?.name ?? "";
    collected += paid;
    expected += exp;
    const delta = exp - paid; // positive = owes team, negative = team owes
    if (delta > 0) {
      debtors.push({ userId: uid, name, amount: delta });
      playersDebt += delta;
    } else if (delta < 0) {
      creditors.push({ userId: uid, name, amount: -delta });
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
