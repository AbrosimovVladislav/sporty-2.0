import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

// GET — list all venues (shared across teams, used in event creation dropdown)
export async function GET() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, city")
    .order("name", { ascending: true });

  if (error) {
    console.error("Venues fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ venues: data ?? [] });
}
