import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type PlayerDetailRow = {
  id: string;
  name: string;
  city: string | null;
  sport: string | null;
  position: string[] | null;
  skill_level: string | null;
  preferred_time: string | null;
  bio: string | null;
  birth_date: string | null;
  looking_for_team: boolean;
  created_at: string;
  district_id: string | null;
  districts: { id: string; name: string } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, city, sport, position, skill_level, preferred_time, bio, birth_date, looking_for_team, created_at, district_id, districts(id, name)")
    .eq("id", id)
    .eq("onboarding_completed", true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = data as unknown as PlayerDetailRow;
  const player = {
    id: row.id,
    name: row.name,
    city: row.city,
    sport: row.sport,
    position: row.position,
    skill_level: row.skill_level,
    preferred_time: row.preferred_time,
    bio: row.bio,
    birth_date: row.birth_date,
    looking_for_team: row.looking_for_team,
    created_at: row.created_at,
    district_id: row.district_id,
    district: row.districts ?? null,
  };

  return NextResponse.json({ player });
}
