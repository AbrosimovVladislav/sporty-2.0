import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*, districts(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      district: user.districts ?? null,
      districts: undefined,
    },
  });
}
