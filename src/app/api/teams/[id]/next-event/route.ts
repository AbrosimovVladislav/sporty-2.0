import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("id, type, date, venues(name), is_public")
    .eq("team_id", teamId)
    .eq("status", "planned")
    .gt("date", now)
    .order("date", { ascending: true })
    .limit(1);

  // Guests only see public events
  if (userId) {
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (!membership) query = query.eq("is_public", true);
  } else {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  const raw = ((data ?? [])[0] as unknown) as
    | { id: string; type: string; date: string; venues: { name: string } | null; is_public: boolean }
    | undefined;

  if (!raw) return NextResponse.json({ event: null });

  // Fetch yes_count separately
  const { count } = await supabase
    .from("event_attendances")
    .select("id", { count: "exact", head: true })
    .eq("event_id", raw.id)
    .eq("vote", "yes");

  return NextResponse.json({
    event: {
      id: raw.id,
      type: raw.type,
      date: raw.date,
      venue: raw.venues,
      yesCount: count ?? 0,
    },
  });
}
