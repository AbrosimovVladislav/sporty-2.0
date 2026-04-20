import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

const EVENT_TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: teamId, userId: targetUserId } = await params;
  const { searchParams } = new URL(req.url);
  const requesterId = searchParams.get("userId");

  if (!requesterId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const supabase = getServiceClient();

  const { data: requesterMembership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", requesterId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!requesterMembership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (requesterMembership.role !== "organizer" && requesterId !== targetUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rawTarget } = await supabase
    .from("users")
    .select("id, name, city")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!rawTarget) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Expected = Σ price_per_player for completed attended events
  const { data: rawAtt } = await supabase
    .from("event_attendances")
    .select("event_id, attended, events!inner(id, type, date, status, price_per_player, team_id)")
    .eq("user_id", targetUserId)
    .eq("attended", true)
    .eq("events.status", "completed")
    .eq("events.team_id", teamId);

  const totalExpected = (rawAtt ?? []).reduce((sum, a) => {
    const ev = a.events as unknown as { price_per_player: number };
    return sum + (ev?.price_per_player ?? 0);
  }, 0);

  // Paid = all transactions
  const { data: rawTx } = await supabase
    .from("financial_transactions")
    .select("id, amount, type, event_id, note, created_at, events(id, type, date)")
    .eq("team_id", teamId)
    .eq("player_id", targetUserId)
    .order("created_at", { ascending: false });

  const totalPaid = (rawTx ?? []).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalPaid - totalExpected;

  const history = (rawTx ?? []).map((t) => {
    const tx = t as unknown as {
      id: string;
      amount: number;
      type: string;
      event_id: string | null;
      note: string | null;
      created_at: string;
      events: { id: string; type: string; date: string } | null;
    };
    const label =
      tx.type === "deposit"
        ? tx.note ? `Депозит: ${tx.note}` : "Депозит"
        : tx.events
        ? `${EVENT_TYPE_LABEL[tx.events.type] ?? tx.events.type} · ${new Date(tx.events.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`
        : "Оплата события";
    return {
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      label,
      note: tx.note,
      created_at: tx.created_at,
    };
  });

  return NextResponse.json({
    user: rawTarget,
    totals: { expected: totalExpected, paid: totalPaid, balance },
    history,
  });
}
