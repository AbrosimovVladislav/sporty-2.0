import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, name, birth_date, skill_level, district_id, position } = await req.json();

  if (!userId || !name?.trim()) {
    return NextResponse.json({ error: "userId and name required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Derive city from district if provided
  let city: string | null = null;
  if (district_id) {
    const { data: district } = await supabase
      .from("districts")
      .select("city")
      .eq("id", district_id)
      .maybeSingle();
    if (district) city = district.city;
  }

  const { data: user, error } = await supabase
    .from("users")
    .update({
      name: name.trim(),
      city,
      sport: "football",
      onboarding_completed: true,
      birth_date: birth_date ?? null,
      skill_level: skill_level ?? null,
      district_id: district_id ?? null,
      position: position ?? null,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Onboarding update error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ user });
}
