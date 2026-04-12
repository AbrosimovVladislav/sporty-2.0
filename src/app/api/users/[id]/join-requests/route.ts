import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

type JoinRequestWithTeam = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  resolved_at: string | null;
  teams: {
    id: string;
    name: string;
    city: string;
    sport: string;
  } | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("join_requests")
    .select("id, status, created_at, resolved_at, teams(id, name, city, sport)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("User join requests fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as JoinRequestWithTeam[];
  const requests = rows
    .filter((r) => r.teams !== null)
    .map((r) => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      team: r.teams!,
    }));

  return NextResponse.json({ requests });
}
