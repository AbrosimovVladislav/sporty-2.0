import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

const EVENT_TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

type AttendedRow = {
  event_id: string;
  events: {
    id: string;
    team_id: string;
    type: string;
    date: string;
    price_per_player: number;
  } | null;
};

type TxRow = {
  id: string;
  team_id: string;
  amount: number;
  type: "event_payment" | "deposit";
  event_id: string | null;
  note: string | null;
  created_at: string;
};

type MembershipRow = {
  team_id: string;
  role: "organizer" | "player";
  teams: { id: string; name: string; logo_url: string | null } | null;
};

type HistoryEntry = {
  id: string;
  kind: "event_expense" | "event_payment" | "deposit";
  team_id: string;
  team_name: string | null;
  amount: number;
  label: string;
  note: string | null;
  date: string;
  event_id: string | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const supabase = getServiceClient();

  const { data: rawMemberships } = await supabase
    .from("team_memberships")
    .select("team_id, role, teams(id, name, logo_url)")
    .eq("user_id", userId);

  const memberships = (rawMemberships ?? []) as unknown as MembershipRow[];

  const { data: rawAtt } = await supabase
    .from("event_attendances")
    .select(
      "event_id, events!inner(id, team_id, type, date, price_per_player, status)",
    )
    .eq("user_id", userId)
    .eq("attended", true)
    .eq("events.status", "completed");

  const attended = (rawAtt ?? []) as unknown as AttendedRow[];
  const expectedByTeam = new Map<string, number>();
  for (const a of attended) {
    if (!a.events) continue;
    const cur = expectedByTeam.get(a.events.team_id) ?? 0;
    expectedByTeam.set(a.events.team_id, cur + (a.events.price_per_player ?? 0));
  }

  const { data: rawTx } = await supabase
    .from("financial_transactions")
    .select("id, team_id, amount, type, event_id, note, created_at")
    .eq("player_id", userId)
    .order("created_at", { ascending: false });

  const txs = (rawTx ?? []) as unknown as TxRow[];
  const paidByTeam = new Map<string, number>();
  for (const t of txs) {
    const cur = paidByTeam.get(t.team_id) ?? 0;
    paidByTeam.set(t.team_id, cur + t.amount);
  }

  const teams = memberships
    .filter((m) => m.teams !== null)
    .map((m) => {
      const team = m.teams!;
      const expected = expectedByTeam.get(m.team_id) ?? 0;
      const paid = paidByTeam.get(m.team_id) ?? 0;
      return {
        team_id: m.team_id,
        team_name: team.name,
        team_logo_url: team.logo_url,
        role: m.role,
        expected,
        paid,
        balance: paid - expected,
      };
    });

  const totals = teams.reduce(
    (acc, t) => ({
      expected: acc.expected + t.expected,
      paid: acc.paid + t.paid,
      balance: acc.balance + t.balance,
    }),
    { expected: 0, paid: 0, balance: 0 },
  );

  const teamNameById = new Map(teams.map((t) => [t.team_id, t.team_name]));

  const formatEventLabel = (type: string, dateIso: string) =>
    `${EVENT_TYPE_LABEL[type] ?? type} · ${new Date(dateIso).toLocaleDateString(
      "ru-RU",
      { day: "numeric", month: "short" },
    )}`;

  const expenseEntries: HistoryEntry[] = attended
    .filter((a) => a.events && (a.events.price_per_player ?? 0) > 0)
    .map((a) => ({
      id: `expense-${a.events!.id}`,
      kind: "event_expense",
      team_id: a.events!.team_id,
      team_name: teamNameById.get(a.events!.team_id) ?? null,
      amount: -(a.events!.price_per_player ?? 0),
      label: formatEventLabel(a.events!.type, a.events!.date),
      note: null,
      date: a.events!.date,
      event_id: a.events!.id,
    }));

  const paymentEntries: HistoryEntry[] = txs.map((t) => ({
    id: t.id,
    kind: t.type,
    team_id: t.team_id,
    team_name: teamNameById.get(t.team_id) ?? null,
    amount: t.amount,
    label:
      t.type === "deposit"
        ? t.note
          ? `Депозит: ${t.note}`
          : "Депозит"
        : "Оплата события",
    note: t.note,
    date: t.created_at,
    event_id: t.event_id,
  }));

  const history = [...expenseEntries, ...paymentEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return NextResponse.json({ teams, totals, history });
}
