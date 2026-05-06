import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { buildProfileDeepLink, notify } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { user_id, inviter_id }: { user_id?: string; inviter_id?: string } = body;

  if (!user_id || !inviter_id) {
    return NextResponse.json(
      { error: "user_id and inviter_id are required" },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", inviter_id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existingMembership } = await supabase
    .from("team_memberships")
    .select("id")
    .eq("user_id", user_id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("join_requests")
    .select("id")
    .eq("user_id", user_id)
    .eq("team_id", teamId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Pending request already exists" }, { status: 409 });
  }

  const { data: invite, error } = await supabase
    .from("join_requests")
    .insert({
      user_id,
      team_id: teamId,
      direction: "team_to_player",
      invited_by: inviter_id,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Invite create error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  (async () => {
    const [{ data: team }, { data: inviter }] = await Promise.all([
      supabase.from("teams").select("name").eq("id", teamId).single(),
      supabase.from("users").select("name").eq("id", inviter_id).single(),
    ]);
    if (!team?.name || !inviter?.name) return;
    await notify(supabase, {
      userIds: [user_id],
      type: "team_invitation_received",
      payload: {
        href: `/profile`,
        team_id: teamId,
        team_name: team.name,
        actor_id: inviter_id,
        actor_name: inviter.name,
      },
      telegramText: `🏅 <b>Тебя пригласили в команду «${team.name}»</b>\n\nОткрой профиль и прими или отклони приглашение.`,
      telegramDeepLink: buildProfileDeepLink(),
    });
  })().catch((e) => console.error("Notify invite error:", e));

  return NextResponse.json({ invite }, { status: 201 });
}
