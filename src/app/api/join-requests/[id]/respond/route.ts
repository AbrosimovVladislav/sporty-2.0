import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { getTeamOrganizers, notify } from "@/lib/notifications";

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

  if (jr.direction !== "team_to_player") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  (async () => {
    const [{ data: team }, { data: actor }, organizerIds] = await Promise.all([
      supabase.from("teams").select("name").eq("id", jr.team_id).single(),
      supabase.from("users").select("name").eq("id", jr.user_id).single(),
      getTeamOrganizers(supabase, jr.team_id),
    ]);
    if (!team?.name || !actor?.name) return;
    await notify(supabase, {
      userIds: organizerIds,
      type:
        decision === "accept"
          ? "team_invitation_accepted"
          : "team_invitation_rejected",
      payload: {
        href: `/team/${jr.team_id}`,
        team_id: jr.team_id,
        team_name: team.name,
        actor_id: jr.user_id,
        actor_name: actor.name,
      },
      telegramText:
        decision === "accept"
          ? `✅ <b>${actor.name}</b> принял приглашение в команду «${team.name}».`
          : `❌ <b>${actor.name}</b> отклонил приглашение в команду «${team.name}».`,
    });
  })().catch((e) => console.error("Notify orgs invite respond error:", e));

  return NextResponse.json({ status: newStatus });
}
