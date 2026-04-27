import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type TeamRow = {
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
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city")?.trim();
  const sport = searchParams.get("sport")?.trim();
  const lookingForPlayers = searchParams.get("looking_for_players");
  const district_id = searchParams.get("district_id")?.trim();
  const excludeRaw = searchParams.get("exclude_ids")?.trim();
  const excludeIds = excludeRaw
    ? excludeRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();
  let query = supabase
    .from("teams")
    .select(
      "id, name, sport, city, description, created_at, looking_for_players, district_id, districts(id, name), team_memberships(count)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (sport) query = query.eq("sport", sport);
  if (lookingForPlayers === "true") query = query.eq("looking_for_players", true);
  if (district_id) query = query.eq("district_id", district_id);
  if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);

  const { data, error, count } = await query;
  if (error) {
    console.error("Teams list error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const teams = ((data ?? []) as unknown as TeamRow[]).map((t) => ({
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
  }));

  const nextOffset = teams.length === limit ? offset + limit : null;
  return NextResponse.json({ teams, nextOffset, total: count ?? null });
}

export async function POST(req: NextRequest) {
  const { name, city, sport, userId, district_id } = await req.json();

  if (!name?.trim() || !city?.trim() || !userId) {
    return NextResponse.json({ error: "name, city, userId required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: name.trim(),
      city: city.trim(),
      sport: sport || "football",
      created_by: userId,
      district_id: district_id ?? null,
    })
    .select()
    .single();

  if (teamError) {
    console.error("Team create error:", teamError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const { error: memberError } = await supabase
    .from("team_memberships")
    .insert({ user_id: userId, team_id: team.id, role: "organizer" });

  if (memberError) {
    console.error("Membership create error:", memberError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ team });
}
