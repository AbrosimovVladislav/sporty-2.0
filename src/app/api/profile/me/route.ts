import { NextRequest, NextResponse } from "next/server";
import type { PlayerProfilePayload, PlayerProfileUpdateInput, ProfileTeamSummary } from "@/types/profile";
import type { Database, TeamMembership, User } from "@/types/database";
import { getServiceClient } from "@/lib/supabase-server";
import { getOrCreateTelegramUser, TelegramRequestError } from "@/lib/telegramUserServer";
import { availabilityDayOrder } from "@/types/profile";

type RequestBody = {
  initData?: string;
  updates?: Partial<PlayerProfileUpdateInput>;
};

type MembershipSummary = TeamMembership & {
  team_role_label: string | null;
  team: {
    id: string;
    name: string;
    city: string;
    sport: string;
    description: string | null;
  };
};

const allowedAvailabilityDays = new Set<string>(availabilityDayOrder);

export async function POST(req: NextRequest) {
  try {
    const { initData } = (await req.json()) as RequestBody;
    const { user } = await getOrCreateTelegramUser(initData ?? "");
    const payload = await buildProfilePayload(user);
    return NextResponse.json(payload);
  } catch (error) {
    return handleProfileError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { user } = await getOrCreateTelegramUser(body.initData ?? "");
    const updates = body.updates;

    if (!updates) {
      return NextResponse.json({ error: "updates required" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: memberships, error: membershipsError } = await supabase
      .from("team_memberships")
      .select("id, user_id, team_id, role, team_role_label, left_at, joined_at")
      .eq("user_id", user.id)
      .is("left_at", null);

    if (membershipsError) {
      console.error("Profile memberships fetch error:", membershipsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const currentMemberships = memberships ?? [];
    const currentTeamIds = currentMemberships.map((membership) => membership.team_id);
    const requestedPrimaryTeamId = updates.primaryTeamId === undefined ? user.primary_team_id : updates.primaryTeamId;
    const effectivePrimaryTeamId = requestedPrimaryTeamId ?? currentTeamIds[0] ?? null;

    if (effectivePrimaryTeamId && !currentTeamIds.includes(effectivePrimaryTeamId)) {
      return NextResponse.json({ error: "primary team must be one of current teams" }, { status: 400 });
    }

    const normalizedAvailabilityDays =
      updates.availabilityDays === undefined
        ? user.availability_days
        : updates.availabilityDays.filter((day) => allowedAvailabilityDays.has(day));

    const fullName = [updates.firstName?.trim(), updates.lastName?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    const userPatch: Database["public"]["Tables"]["users"]["Update"] = {
      name: fullName || user.name,
      first_name: updates.firstName?.trim() || null,
      last_name: updates.lastName?.trim() || null,
      sport: updates.sport?.trim() || null,
      position: updates.position?.trim() || null,
      level: updates.level?.trim() || null,
      dominant_side: updates.dominantSide?.trim() || null,
      preferred_format: updates.preferredFormat?.trim() || null,
      is_looking_for_team: updates.isLookingForTeam ?? user.is_looking_for_team,
      available_for_one_off: updates.availableForOneOff ?? user.available_for_one_off,
      available_for_substitutions:
        updates.availableForSubstitutions ?? user.available_for_substitutions,
      availability_days: normalizedAvailabilityDays,
      city: updates.city?.trim() || null,
      age_group: updates.ageGroup?.trim() || null,
      bio: updates.bio?.trim() || null,
      photo_url: updates.photoUrl?.trim() || null,
      primary_team_id: effectivePrimaryTeamId,
    };

    const { data: updatedUser, error: userUpdateError } = await supabase
      .from("users")
      .update(userPatch)
      .eq("id", user.id)
      .select("*")
      .single();

    if (userUpdateError) {
      console.error("Profile user update error:", userUpdateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (effectivePrimaryTeamId) {
      const { error: teamRoleError } = await supabase
        .from("team_memberships")
        .update({
          team_role_label: updates.teamRoleLabel?.trim() || null,
        })
        .eq("user_id", user.id)
        .eq("team_id", effectivePrimaryTeamId)
        .is("left_at", null);

      if (teamRoleError) {
        console.error("Profile team role update error:", teamRoleError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    const payload = await buildProfilePayload(updatedUser);
    return NextResponse.json(payload);
  } catch (error) {
    return handleProfileError(error);
  }
}

async function buildProfilePayload(user: User): Promise<PlayerProfilePayload> {
  const supabase = getServiceClient();
  const { data: membershipRows, error: membershipsError } = await supabase
    .from("team_memberships")
    .select(`
      id,
      user_id,
      team_id,
      role,
      team_role_label,
      left_at,
      joined_at,
      team:teams!inner (
        id,
        name,
        city,
        sport,
        description
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    console.error("Profile memberships error:", membershipsError);
    throw new TelegramRequestError(500, "Database error");
  }

  const memberships = (membershipRows ?? []) as unknown as MembershipSummary[];

  const currentTeams = memberships
    .filter((membership) => membership.left_at === null)
    .map(mapMembershipToProfileTeam);
  const pastTeams = memberships
    .filter((membership) => membership.left_at !== null)
    .map(mapMembershipToProfileTeam);

  const primaryTeam =
    currentTeams.find((team) => team.id === user.primary_team_id) || currentTeams[0] || null;
  const secondaryCurrentTeams = currentTeams.filter((team) => team.id !== primaryTeam?.id);

  const statsSport = user.sport || "football";
  const { data: statsRow, error: statsError } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .eq("sport", statsSport)
    .maybeSingle();

  if (statsError) {
    console.error("Profile stats error:", statsError);
    throw new TelegramRequestError(500, "Database error");
  }

  return {
    user: primaryTeam && !user.primary_team_id ? { ...user, primary_team_id: primaryTeam.id } : user,
    stats: {
      sport: statsRow?.sport ?? user.sport,
      matchesPlayed: statsRow?.matches_played ?? 0,
      goals: statsRow?.goals ?? 0,
      assists: statsRow?.assists ?? 0,
      saves: statsRow?.saves ?? 0,
      cleanSheets: statsRow?.clean_sheets ?? 0,
      averageRating: statsRow?.average_rating ?? null,
    },
    primaryTeam,
    currentTeams: secondaryCurrentTeams,
    pastTeams,
  };
}

function mapMembershipToProfileTeam(membership: MembershipSummary): ProfileTeamSummary {
  return {
    id: membership.team.id,
    name: membership.team.name,
    city: membership.team.city,
    sport: membership.team.sport,
    description: membership.team.description,
    role: membership.role,
    teamRoleLabel:
      membership.team_role_label ||
      (membership.role === "organizer" ? "Организатор" : "Игрок"),
    joinedAt: membership.joined_at,
    leftAt: membership.left_at,
  };
}

function handleProfileError(error: unknown) {
  if (error instanceof TelegramRequestError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("Profile route error:", error);
  return NextResponse.json({ error: "Database error" }, { status: 500 });
}
