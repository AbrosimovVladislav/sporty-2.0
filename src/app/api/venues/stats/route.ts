import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() ?? null;

  const supabase = getServiceClient();

  let query = supabase
    .from("venues")
    .select("id", { count: "exact", head: true });
  if (city) query = query.ilike("city", `%${city}%`);

  const { count } = await query;

  return NextResponse.json({ total: count ?? 0 });
}
