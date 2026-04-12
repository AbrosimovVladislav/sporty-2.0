import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { name, city, sport, userId } = await req.json();

  if (!name?.trim() || !city?.trim() || !userId) {
    return NextResponse.json({ error: "name, city, userId required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Create team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name: name.trim(), city: city.trim(), sport: sport || "football", created_by: userId })
    .select()
    .single();

  if (teamError) {
    console.error("Team create error:", teamError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Add creator as organizer
  const { error: memberError } = await supabase
    .from("team_memberships")
    .insert({ user_id: userId, team_id: team.id, role: "organizer" });

  if (memberError) {
    console.error("Membership create error:", memberError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ team });
}
