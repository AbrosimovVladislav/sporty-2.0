import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

// Promote player to organizer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: teamId, memberId } = await params;
  const body = await req.json();
  const userId: string | undefined = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify caller is an organizer
  const { data: callerMembership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!callerMembership || callerMembership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get target membership
  const { data: target } = await supabase
    .from("team_memberships")
    .select("id, role")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "organizer") {
    return NextResponse.json({ error: "Already an organizer" }, { status: 409 });
  }

  const { error } = await supabase
    .from("team_memberships")
    .update({ role: "organizer" })
    .eq("id", memberId);

  if (error) {
    console.error("Promote error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ role: "organizer" });
}

// Remove player from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: teamId, memberId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify caller is an organizer
  const { data: callerMembership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!callerMembership || callerMembership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get target membership
  const { data: target } = await supabase
    .from("team_memberships")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove yourself
  if (target.user_id === userId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // If target is an organizer, check they're not the last one
  if (target.role === "organizer") {
    const { count } = await supabase
      .from("team_memberships")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "organizer");

    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "Cannot remove the last organizer" }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("team_memberships")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ removed: true });
}
