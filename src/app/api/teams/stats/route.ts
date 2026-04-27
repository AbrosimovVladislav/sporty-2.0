import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim() ?? null;
  const city = searchParams.get("city")?.trim() ?? null;
  const sport = searchParams.get("sport")?.trim() ?? null;

  const supabase = getServiceClient();

  function baseQuery() {
    let q = supabase.from("teams").select("id", { count: "exact", head: true });
    if (city) q = q.ilike("city", `%${city}%`);
    if (sport) q = q.eq("sport", sport);
    return q;
  }

  const [totalRes, lookingRes] = await Promise.all([
    baseQuery(),
    baseQuery().eq("looking_for_players", true),
  ]);

  if (totalRes.error || lookingRes.error) {
    return NextResponse.json(
      { error: totalRes.error?.message ?? lookingRes.error?.message },
      { status: 500 },
    );
  }

  let mine: number | null = null;
  if (userId) {
    let q = supabase
      .from("team_memberships")
      .select("teams!inner(id, city, sport)", { count: "exact", head: true })
      .eq("user_id", userId);
    if (city) q = q.ilike("teams.city", `%${city}%`);
    if (sport) q = q.eq("teams.sport", sport);
    const { count, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    mine = count ?? 0;
  }

  return NextResponse.json({
    total: totalRes.count ?? 0,
    mine,
    lookingForPlayers: lookingRes.count ?? 0,
  });
}
