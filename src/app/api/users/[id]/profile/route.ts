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
  if ("position" in body) {
    const raw = body.position;
    if (raw == null) {
      update.position = null;
    } else if (Array.isArray(raw)) {
      const cleaned = raw
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      update.position = cleaned.length > 0 ? cleaned : null;
    } else {
      return NextResponse.json({ error: "position must be an array of strings" }, { status: 400 });
    }
  }
  if ("skill_level" in body) update.skill_level = body.skill_level ?? null;
  if ("preferred_time" in body) update.preferred_time = body.preferred_time ?? null;
  if ("looking_for_team" in body) update.looking_for_team = Boolean(body.looking_for_team);
  if ("city" in body) update.city = body.city ?? null;
  if ("district_id" in body) update.district_id = body.district_id ?? null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id)
    .select("*, districts(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = data as unknown as { districts?: { id: string; name: string } | null } & typeof data;
  return NextResponse.json({
    user: {
      ...row,
      district: row.districts ?? null,
      districts: undefined,
    },
  });
}
