import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const userId: string | undefined = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Check team exists
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Check user is not already a member
  const { data: existing } = await supabase
    .from("team_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  // Check no pending request already exists (unique index will also catch this)
  const { data: pendingReq } = await supabase
    .from("join_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingReq) {
    return NextResponse.json({ error: "Request already pending" }, { status: 409 });
  }

  const { data: jr, error } = await supabase
    .from("join_requests")
    .insert({ user_id: userId, team_id: teamId })
    .select()
    .single();

  if (error) {
    console.error("Join request insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ joinRequest: jr }, { status: 201 });
}
