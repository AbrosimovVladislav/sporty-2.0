import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, name, birth_date, skill_level, district_id, position } = await req.json();

  if (!userId || !name?.trim()) {
    return NextResponse.json({ error: "userId and name required" }, { status: 400 });
  }

  let positionArr: string[] | null = null;
  if (Array.isArray(position)) {
    const cleaned = position
      .filter((p): p is string => typeof p === "string")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    positionArr = cleaned.length > 0 ? cleaned : null;
  } else if (typeof position === "string" && position.trim()) {
    positionArr = [position.trim()];
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
      position: positionArr,
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
