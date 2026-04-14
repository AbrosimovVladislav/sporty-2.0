import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import {
  getExpectedAmount,
  getPaidAmount,
  isAttendanceAttended,
  isAttendancePaid,
} from "@/lib/finances";

type EventRow = {
  id: string;
  type: string;
  date: string;
  status: string;
  price_per_player: number;
};

type AttendanceRow = {
  event_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  attended_confirmed: boolean | null;
  paid: boolean | null;
  paid_confirmed: boolean | null;
  paid_amount: number | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id: teamId, userId: targetUserId } = await params;
  const { searchParams } = new URL(req.url);
  const requesterId = searchParams.get("userId");

  if (!requesterId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: requesterMembership } = await supabase
    .from("team_memberships")
    .select("role")
    .eq("user_id", requesterId)
    .eq("team_id", teamId)
    .maybeSingle();

  // Player can view their own data; organizer can view anyone's
  if (!requesterMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (requesterMembership.role !== "organizer" && requesterId !== targetUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rawTarget } = await supabase
    .from("users")
    .select("id, name, city")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!rawTarget) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: rawEvents } = await supabase
    .from("events")
    .select("id, type, date, status, price_per_player")
    .eq("team_id", teamId)
    .order("date", { ascending: false });

  const events = (rawEvents ?? []) as EventRow[];
  const completedIds = events.filter((e) => e.status === "completed").map((e) => e.id);

  let attendances: AttendanceRow[] = [];
  if (completedIds.length > 0) {
    const { data: rawAtt } = await supabase
      .from("event_attendances")
      .select("event_id, vote, attended, attended_confirmed, paid, paid_confirmed, paid_amount")
      .eq("user_id", targetUserId)
      .in("event_id", completedIds);
    attendances = (rawAtt ?? []) as AttendanceRow[];
  }

  const attByEvent = new Map<string, AttendanceRow>();
  for (const a of attendances) attByEvent.set(a.event_id, a);

  let totalExpected = 0;
  let totalPaid = 0;

  const history = events
    .filter((e) => e.status === "completed")
    .map((e) => {
      const a = attByEvent.get(e.id);
      if (!a) {
        return {
          eventId: e.id,
          type: e.type,
          date: e.date,
          attended: false,
          paid: false,
          expected: 0,
          paidAmount: 0,
        };
      }
      const expected = getExpectedAmount(a, e.price_per_player);
      const paid = getPaidAmount(a, e.price_per_player);
      totalExpected += expected;
      totalPaid += paid;
      return {
        eventId: e.id,
        type: e.type,
        date: e.date,
        attended: isAttendanceAttended(a),
        paid: isAttendancePaid(a),
        expected,
        paidAmount: paid,
      };
    });

  const balance = totalPaid - totalExpected; // positive = player overpaid (team owes), negative = player owes

  return NextResponse.json({
    user: rawTarget,
    totals: {
      expected: totalExpected,
      paid: totalPaid,
      balance,
    },
    history,
  });
}
