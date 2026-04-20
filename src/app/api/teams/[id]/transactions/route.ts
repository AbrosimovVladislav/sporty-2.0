import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const playerId = searchParams.get("player_id");
  const type = searchParams.get("type");

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

  let query = supabase
    .from("financial_transactions")
    .select("*, users!financial_transactions_player_id_fkey(id, name)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (playerId) query = query.eq("player_id", playerId);
  if (type === "event_payment" || type === "deposit") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { player_id, amount, type, event_id, note, confirmed_by } = body;

  if (!player_id || !amount || !type || !confirmed_by) {
    return NextResponse.json({ error: "player_id, amount, type, confirmed_by required" }, { status: 400 });
  }
  if (!["event_payment", "deposit"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (Number(amount) <= 0) {
    return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", confirmed_by)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("financial_transactions")
    .insert({
      team_id: teamId,
      player_id,
      amount: Number(amount),
      type,
      event_id: event_id ?? null,
      note: note ?? null,
      confirmed_by,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transaction: data }, { status: 201 });
}
