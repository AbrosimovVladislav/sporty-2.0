import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { decodeCursor, encodeCursor, keysetClause } from "@/lib/cursor";

type PlayerRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  position: string[] | null;
  skill_level: string | null;
  skill_rank: number | null;
  created_at: string;
  looking_for_team: boolean;
  district_id: string | null;
  rating: number | null;
  districts: { id: string; name: string } | null;
  team_memberships: {
    team_id: string;
    joined_at: string;
    teams: { id: string; name: string; logo_url: string | null } | null;
  }[] | null;
};

type AttendanceRow = {
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
};

type SortMode = "skill" | "recent" | "name_asc";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city")?.trim();
  const lookingForTeam = searchParams.get("looking_for_team");
  const position = searchParams.get("position")?.trim();
  const district_id = searchParams.get("district_id")?.trim();
  const sortRaw = searchParams.get("sort");
  const sort: SortMode =
    sortRaw === "recent" ? "recent" : sortRaw === "name_asc" ? "name_asc" : "skill";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    50,
  );
  const cursor = decodeCursor(searchParams.get("cursor"));

  const supabase = getServiceClient();

  let query = supabase
    .from("users")
    .select(
      "id, name, avatar_url, city, position, skill_level, skill_rank, created_at, looking_for_team, district_id, rating, districts(id, name), team_memberships(team_id, joined_at, teams(id, name, logo_url))",
      cursor ? undefined : { count: "exact" },
    )
    .eq("onboarding_completed", true);

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (lookingForTeam === "true") query = query.eq("looking_for_team", true);
  if (position) query = query.contains("position", [position]);
  if (district_id) query = query.eq("district_id", district_id);

  // Sort + cursor. For skill sort the cursor is on rating (0..100) with a tie-break on id.
  // NULL rating rows come last; cursor.v = "" sentinel for them so we can keep paging.
  if (sort === "skill") {
    query = query
      .order("rating", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false });
    if (cursor) query = query.or(keysetClause("rating", cursor, "desc"));
  } else if (sort === "name_asc") {
    query = query
      .order("name", { ascending: true })
      .order("id", { ascending: true });
    if (cursor) query = query.or(keysetClause("name", cursor, "asc"));
  } else {
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (cursor) query = query.or(keysetClause("created_at", cursor, "desc"));
  }

  query = query.limit(limit + 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as PlayerRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const ids = pageRows.map((p) => p.id);

  // Reliability batch — only for the current page.
  const reliabilityMap = new Map<
    string,
    { reliability: number | null; played: number }
  >();
  for (const id of ids) reliabilityMap.set(id, { reliability: null, played: 0 });

  if (ids.length > 0) {
    const { data: attendances } = await supabase
      .from("event_attendances")
      .select("user_id, vote, attended, events!inner(status)")
      .in("user_id", ids)
      .eq("events.status", "completed");

    const buckets = new Map<string, { yes: number; attended: number }>();
    for (const id of ids) buckets.set(id, { yes: 0, attended: 0 });

    for (const row of (attendances ?? []) as unknown as AttendanceRow[]) {
      const b = buckets.get(row.user_id);
      if (!b) continue;
      if (row.vote === "yes") b.yes++;
      if (row.attended === true) b.attended++;
    }

    for (const [id, b] of buckets) {
      reliabilityMap.set(id, {
        reliability: b.yes > 0 ? Math.round((b.attended / b.yes) * 100) : null,
        played: b.attended,
      });
    }
  }

  const players = pageRows.map((p) => {
    const stats = reliabilityMap.get(p.id) ?? { reliability: null, played: 0 };
    const teams = (p.team_memberships ?? [])
      .filter((m) => m.teams)
      .sort((a, b) => (a.joined_at < b.joined_at ? 1 : -1))
      .slice(0, 3)
      .map((m) => ({
        id: m.teams!.id,
        name: m.teams!.name,
        logo_url: m.teams!.logo_url,
      }));
    return {
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      city: p.city,
      position: p.position,
      skill_level: p.skill_level,
      looking_for_team: p.looking_for_team,
      district_id: p.district_id,
      rating: p.rating,
      district: p.districts ?? null,
      reliability: stats.reliability,
      played: stats.played,
      teams,
    };
  });

  const last = pageRows[pageRows.length - 1];
  let nextCursor: string | null = null;
  if (hasMore && last) {
    let v: string;
    if (sort === "skill") {
      v = last.rating == null ? "" : String(last.rating);
    } else if (sort === "name_asc") {
      v = last.name;
    } else {
      v = last.created_at;
    }
    nextCursor = encodeCursor({ v, id: last.id });
  }

  return NextResponse.json({ players, nextCursor, total: count ?? 0 });
}
