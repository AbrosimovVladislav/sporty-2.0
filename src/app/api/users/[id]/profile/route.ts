import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const update: UserUpdate = {};
  if ("bio" in body) update.bio = body.bio ?? null;
  if ("birth_date" in body) update.birth_date = body.birth_date ?? null;
  if ("position" in body) update.position = body.position ?? null;
  if ("skill_level" in body) update.skill_level = body.skill_level ?? null;
  if ("preferred_time" in body) update.preferred_time = body.preferred_time ?? null;
  if ("looking_for_team" in body) update.looking_for_team = Boolean(body.looking_for_team);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user: data });
}
