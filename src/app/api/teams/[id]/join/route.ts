import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import {
  buildProfileDeepLink,
  getTeamOrganizers,
  notify,
} from "@/lib/notifications";

const REJECTION_COOLDOWN_DAYS = 7;

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

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const { data: existingMember } = await supabase
    .from("team_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

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

  const { data: lastRejected } = await supabase
    .from("join_requests")
    .select("resolved_at")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("direction", "player_to_team")
    .eq("status", "rejected")
    .order("resolved_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastRejected?.resolved_at) {
    const resolvedAt = new Date(lastRejected.resolved_at);
    const cooldownUntil = new Date(
      resolvedAt.getTime() + REJECTION_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
    );
    if (cooldownUntil.getTime() > Date.now()) {
      return NextResponse.json(
        { error: "cooldown", until: cooldownUntil.toISOString() },
        { status: 409 },
      );
    }
  }

  const { data: jr, error } = await supabase
    .from("join_requests")
    .insert({ user_id: userId, team_id: teamId, direction: "player_to_team" })
    .select()
    .single();

  if (error) {
    console.error("Join request insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Уведомление всем организаторам команды.
  (async () => {
    const [{ data: applicant }, organizerIds] = await Promise.all([
      supabase.from("users").select("name").eq("id", userId).single(),
      getTeamOrganizers(supabase, teamId),
    ]);
    if (!applicant?.name) return;
    await notify(supabase, {
      userIds: organizerIds,
      type: "team_join_request_received",
      payload: {
        href: `/team/${teamId}`,
        team_id: teamId,
        team_name: team.name,
        actor_id: userId,
        actor_name: applicant.name,
      },
      telegramText: `🆕 <b>${applicant.name}</b> хочет вступить в команду «${team.name}»\n\nОткрой Sporty, чтобы принять или отклонить заявку.`,
      telegramDeepLink: buildProfileDeepLink(),
    });
  })().catch((e) => console.error("Notify organizers error:", e));

  return NextResponse.json({ joinRequest: jr }, { status: 201 });
}
