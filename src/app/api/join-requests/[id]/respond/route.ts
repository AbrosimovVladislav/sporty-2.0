import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: requestId } = await params;
  const body = await req.json();
  const { user_id, decision }: { user_id?: string; decision?: "accept" | "reject" } = body;

  if (!user_id || !decision || !["accept", "reject"].includes(decision)) {
    return NextResponse.json(
      { error: "user_id and decision (accept|reject) are required" },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  const { data: jr } = await supabase
    .from("join_requests")
    .select("id, user_id, team_id, direction, status")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (!jr) {
    return NextResponse.json({ error: "Request not found or already resolved" }, { status: 404 });
  }

  // Only team_to_player invites can be responded to by the player
  if (jr.direction !== "team_to_player") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only the invited player can respond
  if (jr.user_id !== user_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newStatus = decision === "accept" ? "accepted" : "rejected";

  const { error: updateError } = await supabase
    .from("join_requests")
    .update({ status: newStatus, resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) {
    console.error("Join request respond error:", updateError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (decision === "accept") {
    const { error: memberError } = await supabase
      .from("team_memberships")
      .insert({ user_id: jr.user_id, team_id: jr.team_id, role: "player" });

    if (memberError) {
      console.error("Membership insert error:", memberError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ status: newStatus });
}
