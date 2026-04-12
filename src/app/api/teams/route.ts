import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const sport = searchParams.get("sport")?.trim();

  const supabase = getServiceClient();
  let query = supabase
    .from("teams")
    .select("id, name, sport, city, description, created_at")
    .order("created_at", { ascending: false });

  if (city) query = query.ilike("city", `%${city}%`);
  if (sport) query = query.eq("sport", sport);

  const { data, error } = await query;
  if (error) {
    console.error("Teams list error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ teams: data ?? [] });
}

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
