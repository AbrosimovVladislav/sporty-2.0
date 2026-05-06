import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type RawInvite = {
  id: string;
  team_id: string;
  invited_by: string | null;
  created_at: string;
  teams: { id: string; name: string; logo_url: string | null } | null;
};

/**
 * Активные team_to_player приглашения этого игрока, отправленные командами,
 * где запрашивающий пользователь — organizer. Используется на /players/[id],
 * чтобы показать «уже приглашён» и кнопку «Отозвать» вместо повторного invite.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: playerId } = await params;
  const { searchParams } = new URL(req.url);
  const inviterId = searchParams.get("inviterId");

  if (!inviterId) {
    return NextResponse.json({ invites: [] });
  }

  const supabase = getServiceClient();

  const { data: orgMemberships } = await supabase
    .from("team_memberships")
    .select("team_id")
    .eq("user_id", inviterId)
    .eq("role", "organizer");

  const orgTeamIds = (orgMemberships ?? []).map((m) => m.team_id);
  if (orgTeamIds.length === 0) {
    return NextResponse.json({ invites: [] });
  }

  const { data: rawInvites, error } = await supabase
    .from("join_requests")
    .select("id, team_id, invited_by, created_at, teams(id, name, logo_url)")
    .eq("user_id", playerId)
    .eq("direction", "team_to_player")
    .eq("status", "pending")
    .in("team_id", orgTeamIds);

  if (error) {
    console.error("Player invites fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const invites = ((rawInvites ?? []) as unknown as RawInvite[])
    .filter((r) => r.teams !== null)
    .map((r) => ({
      id: r.id,
      team_id: r.team_id,
      team_name: r.teams!.name,
      team_logo_url: r.teams!.logo_url,
      invited_by: r.invited_by,
      created_at: r.created_at,
    }));

  return NextResponse.json({ invites });
}
