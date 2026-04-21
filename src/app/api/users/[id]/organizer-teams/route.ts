import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type MembershipWithTeam = {
  team_id: string;
  teams: { id: string; name: string; sport: string; city: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, teams(id, name, sport, city)")
    .eq("user_id", userId)
    .eq("role", "organizer");

  if (error) {
    console.error("Organizer teams fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as MembershipWithTeam[];
  const teams = rows
    .filter((r) => r.teams !== null)
    .map((r) => r.teams!);

  return NextResponse.json({ teams });
}
