import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type MembershipWithTeam = {
  role: "organizer" | "player";
  joined_at: string;
  teams: {
    id: string;
    name: string;
    sport: string;
    city: string;
    description: string | null;
    created_at: string;
    looking_for_players: boolean;
    district_id: string | null;
    districts: { id: string; name: string } | null;
    team_memberships: { count: number }[];
  } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("team_memberships")
    .select(
      "role, joined_at, teams(id, name, sport, city, description, created_at, looking_for_players, district_id, districts(id, name), team_memberships(count))",
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("User teams fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const memberships = (data ?? []) as unknown as MembershipWithTeam[];
  const teams = memberships
    .filter((m) => m.teams !== null)
    .map((m) => {
      const t = m.teams!;
      return {
        id: t.id,
        name: t.name,
        sport: t.sport,
        city: t.city,
        description: t.description,
        created_at: t.created_at,
        looking_for_players: t.looking_for_players,
        district_id: t.district_id,
        district: t.districts ?? null,
        members_count: Array.isArray(t.team_memberships)
          ? (t.team_memberships[0] as { count: number } | undefined)?.count ?? 0
          : 0,
        role: m.role,
      };
    });

  return NextResponse.json({ teams });
}
