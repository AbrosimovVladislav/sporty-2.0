import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const name = searchParams.get("name")?.trim();
  const q = searchParams.get("q")?.trim();

  const supabase = getServiceClient();
  let query = supabase
    .from("venues")
    .select("id, name, address, city")
    .order("name", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  } else {
    if (city) query = query.ilike("city", `%${city}%`);
    if (name) query = query.ilike("name", `%${name}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Venues fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ venues: data ?? [] });
}
