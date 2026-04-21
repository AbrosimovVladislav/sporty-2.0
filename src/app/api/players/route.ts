import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type PlayerRow = {
  id: string;
  name: string;
  city: string | null;
  position: string | null;
  skill_level: string | null;
  looking_for_team: boolean;
  district_id: string | null;
  districts: { id: string; name: string } | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const lookingForTeam = searchParams.get("looking_for_team");
  const position = searchParams.get("position")?.trim();
  const district_id = searchParams.get("district_id")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();

  let query = supabase
    .from("users")
    .select("id, name, city, position, skill_level, looking_for_team, district_id, districts(id, name)")
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (city) query = query.ilike("city", `%${city}%`);
  if (lookingForTeam === "true") query = query.eq("looking_for_team", true);
  if (position) query = query.ilike("position", `%${position}%`);
  if (district_id) query = query.eq("district_id", district_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const players = ((data ?? []) as unknown as PlayerRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    position: p.position,
    skill_level: p.skill_level,
    looking_for_team: p.looking_for_team,
    district_id: p.district_id,
    district: p.districts ?? null,
  }));

  return NextResponse.json({ players });
}
