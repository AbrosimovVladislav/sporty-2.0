import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type PlayerRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  position: string[] | null;
  skill_level: string | null;
  looking_for_team: boolean;
  district_id: string | null;
  districts: { id: string; name: string } | null;
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
  if (position) query = query.contains("position", [position]);
  if (district_id) query = query.eq("district_id", district_id);

  if (sort === "skill") {
    query = query
      .order("skill_rank", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else if (sort === "name_asc") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const baseRows = (data ?? []) as unknown as PlayerRow[];
  const ids = baseRows.map((p) => p.id);

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

  const players = baseRows.map((p) => {
    const stats = reliabilityMap.get(p.id) ?? { reliability: null, played: 0 };
    return {
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      city: p.city,
      position: p.position,
      skill_level: p.skill_level,
      looking_for_team: p.looking_for_team,
      district_id: p.district_id,
      district: p.districts ?? null,
      reliability: stats.reliability,
      played: stats.played,
    };
  });

  const nextOffset = players.length === limit ? offset + limit : null;
  return NextResponse.json({ players, nextOffset, total: count ?? null });
}
