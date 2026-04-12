import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, name, city, sport } = await req.json();

  if (!userId || !name?.trim() || !city?.trim()) {
    return NextResponse.json(
      { error: "userId, name, city required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data: user, error } = await supabase
    .from("users")
    .update({
      name: name.trim(),
      city: city.trim(),
      sport: sport || "football",
      onboarding_completed: true,
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
