import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type PlayerRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  position: string | null;
  skill_level: string | null;
  looking_for_team: boolean;
  district_id: string | null;
  districts: { id: string; name: string } | null;
};

type SortMode = "skill" | "recent";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city")?.trim();
  const lookingForTeam = searchParams.get("looking_for_team");
  const position = searchParams.get("position")?.trim();
  const district_id = searchParams.get("district_id")?.trim();
  const sort: SortMode = searchParams.get("sort") === "recent" ? "recent" : "skill";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();

  let query = supabase
    .from("users")
    .select(
      "id, name, avatar_url, city, position, skill_level, looking_for_team, district_id, districts(id, name)",
      { count: "exact" },
    )
    .eq("onboarding_completed", true);

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (lookingForTeam === "true") query = query.eq("looking_for_team", true);
  if (position) query = query.eq("position", position);
  if (district_id) query = query.eq("district_id", district_id);

  if (sort === "skill") {
    query = query
      .order("skill_rank", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const players = ((data ?? []) as unknown as PlayerRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    avatar_url: p.avatar_url,
    city: p.city,
    position: p.position,
    skill_level: p.skill_level,
    looking_for_team: p.looking_for_team,
    district_id: p.district_id,
    district: p.districts ?? null,
  }));

  const nextOffset = players.length === limit ? offset + limit : null;
  return NextResponse.json({ players, nextOffset, total: count ?? null });
}
