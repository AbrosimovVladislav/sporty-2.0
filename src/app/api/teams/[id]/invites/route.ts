import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { sendMessage, buildProfileDeepLink } from "@/lib/telegram-bot";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { user_id, inviter_id }: { user_id?: string; inviter_id?: string } = body;

  if (!user_id || !inviter_id) {
    return NextResponse.json({ error: "user_id and inviter_id are required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify inviter is organizer
  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", inviter_id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check user is not already a member
  const { data: existingMembership } = await supabase
    .from("team_memberships")
    .select("id")
    .eq("user_id", user_id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  // Check no pending request exists in either direction
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

  // Notify player via Telegram (fire-and-forget)
  notifyPlayer(supabase, teamId, user_id).catch((e) =>
    console.error("Notify invite error:", e)
  );

  return NextResponse.json({ invite }, { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyPlayer(supabase: any, teamId: string, userId: string) {
  const [{ data: user }, { data: team }] = await Promise.all([
    supabase.from("users").select("telegram_id").eq("id", userId).single(),
    supabase.from("teams").select("name").eq("id", teamId).single(),
  ]);

  if (!user?.telegram_id || !team?.name) return;

  const text = `🏅 <b>Тебя пригласили в команду «${team.name}»</b>\n\nОткрой профиль и прими или отклони приглашение.`;

  await sendMessage(user.telegram_id, text, {
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть Sporty", url: buildProfileDeepLink() }]],
    },
  });
}
