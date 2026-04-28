import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const userId: string | undefined = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: membership } = await supabase
    .from("team_memberships")
    .select("id, role")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 404 });
  }

  if (membership.role === "organizer") {
    const { count } = await supabase
      .from("team_memberships")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "organizer");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Вы последний организатор. Назначьте другого организатора перед выходом." },
        { status: 400 },
      );
    }
  }

  const { error } = await supabase
    .from("team_memberships")
    .delete()
    .eq("id", membership.id);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ left: true });
}
