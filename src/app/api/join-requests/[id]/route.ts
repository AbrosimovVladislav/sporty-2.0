import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: requestId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: jr } = await supabase
    .from("join_requests")
    .select("id, user_id, team_id, status, direction, invited_by")
    .eq("id", requestId)
    .maybeSingle();

  if (!jr) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (jr.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending requests can be withdrawn" },
      { status: 409 },
    );
  }

  const isAuthor = jr.user_id === userId && jr.direction === "player_to_team";
  let isOrganizer = false;
  if (jr.direction === "team_to_player") {
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", jr.team_id)
      .maybeSingle();
    isOrganizer = membership?.role === "organizer";
  }

  if (!isAuthor && !isOrganizer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("join_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error("Withdraw join request error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
