import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { id: teamId, eventId } = await params;
  const body = await req.json();
  const { userId, targetUserId, attended, paid, paid_amount } = body;

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: event } = await supabase
    .from("events")
    .select("id, status, price_per_player")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status !== "completed") {
    return NextResponse.json({ error: "Event must be completed to mark attendance" }, { status: 400 });
  }

  const isOrganizer = membership.role === "organizer";
  const effectiveTargetId = targetUserId ?? userId;

  if (effectiveTargetId !== userId && !isOrganizer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Handle attendance field update
  if (attended !== undefined) {
    const { data: existing } = await supabase
      .from("event_attendances")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", effectiveTargetId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("event_attendances")
        .update({ attended })
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("event_attendances")
        .insert({ event_id: eventId, user_id: effectiveTargetId, attended });
      if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  // Handle payment via financial_transactions (source of truth)
  if (paid !== undefined) {
    if (paid === true) {
      // Only organizers may set custom paid_amount
      const amount = isOrganizer && paid_amount != null
        ? Number(paid_amount)
        : (event.price_per_player ?? 0);

      await supabase
        .from("financial_transactions")
        .delete()
        .eq("event_id", eventId)
        .eq("player_id", effectiveTargetId)
        .eq("type", "event_payment");

      if (amount > 0) {
        await supabase.from("financial_transactions").insert({
          team_id: teamId,
          player_id: effectiveTargetId,
          amount,
          type: "event_payment",
          event_id: eventId,
          confirmed_by: userId,
        });
      }
    } else if (paid === false) {
      await supabase
        .from("financial_transactions")
        .delete()
        .eq("event_id", eventId)
        .eq("player_id", effectiveTargetId)
        .eq("type", "event_payment");
    }
  } else if (isOrganizer && paid_amount != null) {
    // Organizer changed amount without toggling paid — update existing transaction
    await supabase
      .from("financial_transactions")
      .update({ amount: Number(paid_amount) })
      .eq("event_id", eventId)
      .eq("player_id", effectiveTargetId)
      .eq("type", "event_payment");
  }

  return NextResponse.json({ ok: true });
}
