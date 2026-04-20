import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, city, sport, position, skill_level, preferred_time, bio, birth_date, looking_for_team, created_at")
    .eq("id", id)
    .eq("onboarding_completed", true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ player: data });
}
