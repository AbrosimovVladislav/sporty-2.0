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
    .select("role, joined_at, teams(id, name, sport, city)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("User teams fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const memberships = (data ?? []) as unknown as MembershipWithTeam[];
  const teams = memberships
    .filter((m) => m.teams !== null)
    .map((m) => ({ ...m.teams!, role: m.role }));

  return NextResponse.json({ teams });
}
