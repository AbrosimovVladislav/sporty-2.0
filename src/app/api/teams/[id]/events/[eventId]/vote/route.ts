import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id: teamId, eventId } = await params;
  const body = await req.json();
  const { userId, vote } = body;

  if (!userId || !vote || !["yes", "no"].includes(vote)) {
    return NextResponse.json({ error: "userId and vote (yes/no) are required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify event exists and is planned
  const { data: event } = await supabase
    .from("events")
    .select("id, status, is_public")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status !== "planned") {
    return NextResponse.json({ error: "Event is not open for voting" }, { status: 400 });
  }

  // For non-public events, require team membership
  if (!event.is_public) {
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Upsert attendance record
  const { data: existing } = await supabase
    .from("event_attendances")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_attendances")
      .update({ vote })
      .eq("id", existing.id);

    if (error) {
      console.error("Vote update error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("event_attendances")
      .insert({ event_id: eventId, user_id: userId, vote });

    if (error) {
      console.error("Vote insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ vote });
}
