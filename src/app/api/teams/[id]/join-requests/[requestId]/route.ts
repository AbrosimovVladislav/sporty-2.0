import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { notify } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { id: teamId, requestId } = await params;
  const body = await req.json();
  const userId: string | undefined = body.userId;
  const action: string | undefined = body.action;

  if (!userId || !action || !["accept", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "userId and action (accept|reject) are required" },
      { status: 400 },
    );
  }

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

  const { data: jr } = await supabase
    .from("join_requests")
    .select("id, user_id, team_id, status")
    .eq("id", requestId)
    .eq("team_id", teamId)
    .eq("direction", "player_to_team")
    .eq("status", "pending")
    .maybeSingle();

  if (!jr) {
    return NextResponse.json(
      { error: "Request not found or already resolved" },
      { status: 404 },
    );
  }

  const newStatus = action === "accept" ? "accepted" : "rejected";

  const { error: updateError } = await supabase
    .from("join_requests")
    .update({ status: newStatus, resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) {
    console.error("Join request update error:", updateError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (action === "accept") {
    const { error: memberError } = await supabase
      .from("team_memberships")
      .insert({ user_id: jr.user_id, team_id: teamId, role: "player" });

    if (memberError) {
      console.error("Membership insert error:", memberError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  (async () => {
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();
    if (!team?.name) return;
    await notify(supabase, {
      userIds: [jr.user_id],
      type:
        action === "accept"
          ? "team_join_request_accepted"
          : "team_join_request_rejected",
      payload: {
        href: action === "accept" ? `/team/${teamId}` : `/profile`,
        team_id: teamId,
        team_name: team.name,
      },
      telegramText:
        action === "accept"
          ? `✅ Тебя приняли в команду «${team.name}»! Открой Sporty.`
          : `❌ Заявку в команду «${team.name}» отклонили.`,
    });
  })().catch((e) => console.error("Notify applicant error:", e));

  return NextResponse.json({ status: newStatus });
}
