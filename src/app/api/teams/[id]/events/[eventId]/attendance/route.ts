import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

// PATCH — mark attendance (player for self, organizer for anyone)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id: teamId, eventId } = await params;
  const body = await req.json();
  const { userId, targetUserId, attended, paid, paid_amount } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status !== "completed") {
    return NextResponse.json({ error: "Event must be completed to mark attendance" }, { status: 400 });
  }

  const isOrganizer = membership.role === "organizer";
  const effectiveTargetId = targetUserId ?? userId;

  // Only organizer can modify other users
  if (effectiveTargetId !== userId && !isOrganizer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: {
    attended?: boolean | null;
    paid?: boolean | null;
    paid_amount?: number | null;
  } = {};

  if (attended !== undefined) update.attended = attended;
  if (paid !== undefined) update.paid = paid;
  if (paid_amount !== undefined) {
    update.paid_amount = paid_amount === null ? null : Number(paid_amount);
  }

  // Unmarking paid clears the explicit amount
  if (update.paid === false) {
    update.paid_amount = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("event_attendances")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", effectiveTargetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_attendances")
      .update(update)
      .eq("id", existing.id);

    if (error) {
      console.error("Attendance update error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("event_attendances")
      .insert({ event_id: eventId, user_id: effectiveTargetId, ...update });

    if (error) {
      console.error("Attendance insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
