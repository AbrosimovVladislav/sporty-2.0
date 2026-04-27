import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim() ?? null;
  const city = searchParams.get("city")?.trim() ?? null;

  const supabase = getServiceClient();

  function baseQuery() {
    let q = supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("onboarding_completed", true);
    if (city) q = q.ilike("city", `%${city}%`);
    return q;
  }

  const [totalRes, lookingRes] = await Promise.all([
    baseQuery(),
    baseQuery().eq("looking_for_team", true),
  ]);

  if (totalRes.error || lookingRes.error) {
    return NextResponse.json(
      { error: totalRes.error?.message ?? lookingRes.error?.message },
      { status: 500 },
    );
  }

  let inMyTeams: number | null = null;
  if (userId) {
    const { data: myTeams, error: teamsErr } = await supabase
      .from("team_memberships")
      .select("team_id")
      .eq("user_id", userId);

    if (teamsErr) {
      return NextResponse.json({ error: teamsErr.message }, { status: 500 });
    }

    const teamIds = (myTeams ?? []).map((t) => t.team_id);
    if (teamIds.length === 0) {
      inMyTeams = 0;
    } else {
      let memberQuery = supabase
        .from("team_memberships")
        .select("user_id, users!inner(city, onboarding_completed)", {
          count: "exact",
          head: false,
        })
        .in("team_id", teamIds);

      if (city) memberQuery = memberQuery.ilike("users.city", `%${city}%`);

      const { data: members, error: membersErr } = await memberQuery;
      if (membersErr) {
        return NextResponse.json({ error: membersErr.message }, { status: 500 });
      }

      const unique = new Set(
        (members ?? [])
          .filter((m) => m.user_id !== userId)
          .map((m) => m.user_id),
      );
      inMyTeams = unique.size;
    }
  }

  return NextResponse.json({
    total: totalRes.count ?? 0,
    inMyTeams,
    lookingForTeam: lookingRes.count ?? 0,
  });
}
