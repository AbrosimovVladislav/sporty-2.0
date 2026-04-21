import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();

  const supabase = getServiceClient();
  let query = supabase
    .from("districts")
    .select("id, city, name")
    .order("name", { ascending: true });

  if (city) query = query.eq("city", city);

  const { data, error } = await query;
  if (error) {
    console.error("Districts fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ districts: data ?? [] });
}
