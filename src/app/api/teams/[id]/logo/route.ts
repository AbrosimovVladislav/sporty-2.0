import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userId = formData.get("userId") as string | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!userId)
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${teamId}/logo-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("team-logos")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const {
    data: { publicUrl },
  } = supabase.storage.from("team-logos").getPublicUrl(path);

  const { data, error } = await supabase
    .from("teams")
    .update({ logo_url: publicUrl })
    .eq("id", teamId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ team: data });
}
