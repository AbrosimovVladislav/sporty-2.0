import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type VenueRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  district_id: string | null;
  default_cost: number | null;
  photo_url: string | null;
  districts: { id: string; name: string } | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const name = searchParams.get("name")?.trim();
  const q = searchParams.get("q")?.trim();
  const district_id = searchParams.get("district_id")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = getServiceClient();
  let query = supabase
    .from("venues")
    .select(
      "id, name, address, city, district_id, default_cost, photo_url, districts(id, name)",
      { count: "exact" },
    )
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  } else {
    if (city) query = query.ilike("city", `%${city}%`);
    if (name) query = query.ilike("name", `%${name}%`);
  }
  if (district_id) query = query.eq("district_id", district_id);

  const { data, error, count } = await query;
  if (error) {
    console.error("Venues fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const venues = ((data ?? []) as unknown as VenueRow[]).map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    city: v.city,
    district_id: v.district_id,
    default_cost: v.default_cost,
    photo_url: v.photo_url,
    district: v.districts ?? null,
  }));

  const nextOffset = venues.length === limit ? offset + limit : null;
  return NextResponse.json({ venues, nextOffset, total: count ?? null });
}
