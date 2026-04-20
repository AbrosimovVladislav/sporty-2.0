import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

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

  // Expected = Σ price_per_player for completed attended events
  const { data: attendedEvents } = await supabase
    .from("event_attendances")
    .select("event_id, events!inner(price_per_player, status, team_id)")
    .eq("user_id", targetUserId)
    .eq("attended", true)
    .eq("events.status", "completed")
    .eq("events.team_id", teamId);

  const expected = (attendedEvents ?? []).reduce((sum, a) => {
    const ev = a.events as unknown as { price_per_player: number };
    return sum + (ev?.price_per_player ?? 0);
  }, 0);

  // Paid = Σ transactions
  const { data: transactions } = await supabase
    .from("financial_transactions")
    .select("id, amount, type, event_id, note, created_at, events(type, date)")
    .eq("team_id", teamId)
    .eq("player_id", targetUserId)
    .order("created_at", { ascending: false });

  const paid = (transactions ?? []).reduce((sum, t) => sum + t.amount, 0);
  const balance = paid - expected;

  return NextResponse.json({ expected, paid, balance, transactions: transactions ?? [] });
}
