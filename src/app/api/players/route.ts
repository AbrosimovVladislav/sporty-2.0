import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const lookingForTeam = searchParams.get("looking_for_team");
  const position = searchParams.get("position")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();

  let query = supabase
    .from("users")
    .select("id, name, city, position, skill_level, looking_for_team")
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (city) query = query.ilike("city", `%${city}%`);
  if (lookingForTeam === "true") query = query.eq("looking_for_team", true);
  if (position) query = query.ilike("position", `%${position}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ players: data ?? [] });
}
