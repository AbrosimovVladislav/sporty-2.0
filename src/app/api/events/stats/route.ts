import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() ?? null;

  const supabase = getServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  const baseFilter = (q: ReturnType<typeof supabase.from>) => {
    let r = q
      .eq("is_public", true)
      .eq("status", "planned")
      .gt("date", nowIso);
    if (city) r = r.eq("venues.city", city);
    return r;
  };

  const join = city
    ? "id, venues!inner(city)"
    : "id";

  const total = await baseFilter(
    supabase.from("events").select(join, { count: "exact", head: true }),
  );

  const today = await baseFilter(
    supabase
      .from("events")
      .select(join, { count: "exact", head: true })
      .lte("date", endOfDay.toISOString()),
  );

  const week = await baseFilter(
    supabase
      .from("events")
      .select(join, { count: "exact", head: true })
      .lte("date", endOfWeek.toISOString()),
  );

  return NextResponse.json({
    total: total.count ?? 0,
    today: today.count ?? 0,
    week: week.count ?? 0,
  });
}
