"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam, type TeamMember } from "../team-context";
import { TeamPlayerSheet } from "@/components/team/lazy";
import { SkeletonCard } from "@/components/Skeleton";
import { Avatar, Button, SectionEyebrow } from "@/components/ui";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatMoney, formatMonthShort, pluralize } from "@/lib/format";

type FinancesData = {
  metrics: {
    collected: number;
    expected: number;
    venueCostTotal: number;
    venuePaidTotal: number;
    venueOutstanding: number;
    playersDebt: number;
    playersOverpaid: number;
    cash: number;
    realBalance: number;
  };
  debtors: { userId: string; name: string; amount: number }[];
  creditors: { userId: string; name: string; amount: number }[];
  venueEvents: {
    eventId: string;
    type: string;
    date: string;
    venueName: string | null;
    cost: number;
    paid: number;
  }[];
};

type FlowMonth = { month: string; collected: number; venuePaid: number };

type InsightsFinance = {
  financeFlowByMonth: FlowMonth[] | null;
};

type Member = { user_id: string; name: string };

export default function TeamFinancesPage() {
  const team = useTeam();
  const auth = useAuth();
  const [data, setData] = useState<FinancesData | null>(null);
  const [insights, setInsights] = useState<InsightsFinance | null>(null);
  const [openMember, setOpenMember] = useState<TeamMember | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const teamMembers = team.status === "ready" ? team.members : [];

  // Members for DepositModal — берём из team-context, лишний fetch не нужен.
  const members = useMemo<Member[]>(
    () => teamMembers.map((m) => ({ user_id: m.user.id, name: m.user.name })),
    [teamMembers],
  );

  const load = () => {
    if (!teamId || !userId) return;
    Promise.all([
      fetch(`/api/teams/${teamId}/finances?userId=${userId}`).then(async (r) => {
        if (!r.ok) { setError("Доступ запрещён"); return null; }
        return r.json() as Promise<FinancesData>;
      }),
      fetch(`/api/teams/${teamId}/insights?userId=${userId}`).then((r) =>
        r.ok ? (r.json() as Promise<InsightsFinance>) : null,
      ),
    ]).then(([fin, ins]) => {
      if (fin) setData(fin);
      if (ins) setInsights(ins);
    }).catch(() => setError("Не удалось загрузить"));
  };

  useEffect(() => { load(); }, [teamId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (team.status === "loading" || data === null) {
    return error ? (
      <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
        <p className="text-[15px] text-text-secondary text-center">{error}</p>
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-28" />
      </div>
    );
  }

  if (team.status !== "ready" || team.role !== "organizer") return null;

  const m = data.metrics;
  const debtorsMax = data.debtors.length > 0 ? data.debtors[0].amount : 0;
  const creditorsMax = data.creditors.length > 0 ? data.creditors[0].amount : 0;

  const openPlayer = (uid: string) => {
    const found = teamMembers.find((tm) => tm.user.id === uid);
    if (found) setOpenMember(found);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* 1. Hero KPI */}
        <div className="bg-gray-900 rounded-[16px] p-5">
          <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-white/50 mb-1.5">
            Реальный баланс
          </p>
          <span
            className={`font-display text-[40px] font-bold tabular-nums leading-none ${
              m.realBalance >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {m.realBalance >= 0 ? "+" : ""}
            {formatMoney(m.realBalance)}
          </span>
          <div className="border-t border-white/10 mt-4 pt-4 grid grid-cols-3 gap-2">
            <HeroSegment label="В кассе" value={formatMoney(m.cash)} />
            <HeroSegment
              label="Долг игроков"
              value={formatMoney(m.playersDebt)}
              danger={m.playersDebt > 0}
            />
            <HeroSegment
              label="Долг площадкам"
              value={formatMoney(m.venueOutstanding)}
              danger={m.venueOutstanding > 0}
            />
          </div>
        </div>

        {/* 2. Сводка */}
        <MetricsBreakdown collected={m.collected} venueCost={m.venueCostTotal} />

        {/* 3. Bar chart — поток за 6 месяцев */}
        {insights?.financeFlowByMonth && insights.financeFlowByMonth.length > 0 && (
          <FlowChart data={insights.financeFlowByMonth} />
        )}

        {/* 4. Маржа */}
        {(m.collected > 0 || m.venuePaidTotal > 0) && (
          <MarginBar collected={m.collected} venuePaid={m.venuePaidTotal} />
        )}

        {/* 5. Должники */}
        {data.debtors.length > 0 && (
          <div className="bg-bg-primary rounded-[16px] overflow-hidden shadow-sm">
            <div className="px-4 pt-4 pb-1">
              <SectionEyebrow>Должны · {data.debtors.length}</SectionEyebrow>
            </div>
            <ul className="divide-y divide-gray-100">
              {data.debtors.map((d) => (
                <DebtorRow
                  key={`debt-${d.userId}`}
                  userId={d.userId}
                  name={d.name}
                  amount={d.amount}
                  maxAmount={debtorsMax}
                  color="danger"
                  sign="−"
                  onOpen={openPlayer}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 6. Переплатили */}
        {data.creditors.length > 0 && (
          <div className="bg-bg-primary rounded-[16px] overflow-hidden shadow-sm">
            <div className="px-4 pt-4 pb-1">
              <SectionEyebrow>Переплатили · {data.creditors.length}</SectionEyebrow>
            </div>
            <ul className="divide-y divide-gray-100">
              {data.creditors.map((c) => (
                <DebtorRow
                  key={`cred-${c.userId}`}
                  userId={c.userId}
                  name={c.name}
                  amount={c.amount}
                  maxAmount={creditorsMax}
                  color="success"
                  sign="+"
                  onOpen={openPlayer}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 7. Площадки */}
        {data.venueEvents.length > 0 && teamId && (
          <VenuesAccordion teamId={teamId} events={data.venueEvents} />
        )}

        {/* 8. Депозит */}
        <DepositCard onClick={() => setShowDeposit(true)} />
      </div>

      {teamId && userId && openMember && (
        <TeamPlayerSheet
          member={openMember}
          teamId={teamId}
          currentUserId={userId}
          isOrganizer={true}
          initialSection="finances"
          onClose={() => setOpenMember(null)}
          onActionDone={() => { setOpenMember(null); load(); }}
        />
      )}

      {showDeposit && teamId && userId && (
        <DepositModal
          teamId={teamId}
          organizerId={userId}
          members={members}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { setShowDeposit(false); load(); }}
        />
      )}
    </>
  );
}

/* ─── Hero segment ─── */

function HeroSegment({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] text-white/40 uppercase tracking-[0.05em] truncate">
        {label}
      </span>
      <span className={`text-[13px] font-semibold tabular-nums truncate ${danger ? "text-red-400" : "text-white/80"}`}>
        {value}
      </span>
    </div>
  );
}

/* ─── Metrics breakdown ─── */

function MetricCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: accent ? "var(--color-primary)" : "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function MetricsBreakdown({
  collected,
  venueCost,
}: {
  collected: number;
  venueCost: number;
}) {
  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.06em] font-semibold mb-3" style={{ color: "var(--text-tertiary)" }}>
        Сводка
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <MetricCell label="Собрано за всё время" value={formatMoney(collected)} accent={collected > 0} />
        <MetricCell label="Расходы на площадки" value={formatMoney(venueCost)} />
      </div>
    </div>
  );
}

/* ─── Flow bar chart ─── */

function FlowChart({ data }: { data: FlowMonth[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.collected, d.venuePaid]), 1);
  const CHART_H = 64;
  const BAR_W = 10;
  const PAIR_GAP = 2;
  const COLS = data.length;
  const COL_W = 44;
  const TOTAL_W = COLS * COL_W;
  const LABEL_PAD = 14;

  const totalCollected = data.reduce((s, d) => s + d.collected, 0);
  const totalVenue = data.reduce((s, d) => s + d.venuePaid, 0);
  const net = totalCollected - totalVenue;

  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <p className="text-[13px] font-semibold text-text-primary mb-3">Поток за 6 месяцев</p>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${CHART_H + LABEL_PAD + 14}`}
        className="w-full"
        style={{ height: `${CHART_H + LABEL_PAD + 14}px` }}
      >
        {data.map((d, idx) => {
          const colCx = idx * COL_W + COL_W / 2;
          const ch = d.collected > 0 ? Math.max((d.collected / maxVal) * CHART_H, 2) : 0;
          const vh = d.venuePaid > 0 ? Math.max((d.venuePaid / maxVal) * CHART_H, 2) : 0;
          const collectedX = colCx - BAR_W - PAIR_GAP / 2 + BAR_W / 2;
          const venueX = colCx + PAIR_GAP / 2 + BAR_W / 2;
          return (
            <g key={d.month}>
              {ch > 0 && (
                <rect
                  x={colCx - BAR_W - PAIR_GAP / 2}
                  y={LABEL_PAD + CHART_H - ch}
                  width={BAR_W}
                  height={ch}
                  rx={2}
                  fill="var(--color-primary)"
                  opacity={0.85}
                />
              )}
              {vh > 0 && (
                <rect
                  x={colCx + PAIR_GAP / 2}
                  y={LABEL_PAD + CHART_H - vh}
                  width={BAR_W}
                  height={vh}
                  rx={2}
                  fill="var(--gray-400)"
                />
              )}
              {d.collected > 0 && (
                <text
                  x={collectedX}
                  y={LABEL_PAD + CHART_H - ch - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={600}
                  fill="var(--color-primary)"
                >
                  {compactNum(d.collected)}
                </text>
              )}
              {d.venuePaid > 0 && (
                <text
                  x={venueX}
                  y={LABEL_PAD + CHART_H - vh - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={600}
                  fill="var(--text-secondary)"
                >
                  {compactNum(d.venuePaid)}
                </text>
              )}
              <text
                x={colCx}
                y={LABEL_PAD + CHART_H + 11}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-secondary)"
              >
                {formatMonthShort(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
            Сборы
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span className="w-2 h-2 rounded-sm bg-border inline-block" />
            Площадки
          </span>
        </div>
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: net >= 0 ? "var(--green-600)" : "var(--danger)" }}
        >
          Чистый: {net >= 0 ? "+" : ""}{formatMoney(net)}
        </span>
      </div>
    </div>
  );
}

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/* ─── Margin bar ─── */

function MarginBar({ collected, venuePaid }: { collected: number; venuePaid: number }) {
  const net = collected - venuePaid;
  const total = Math.max(collected + venuePaid, 1);
  const collectedPct = (collected / total) * 100;
  const venuePct = (venuePaid / total) * 100;
  const collectedPctRound = Math.round(collectedPct);
  const venuePctRound = Math.round(venuePct);

  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[14px] font-semibold text-text-primary">Маржинальность</p>
        <span
          className="font-display text-[18px] font-bold tabular-nums"
          style={{ color: net >= 0 ? "var(--green-600)" : "var(--danger)" }}
        >
          {net >= 0 ? "+" : ""}{formatMoney(net)}
        </span>
      </div>

      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--gray-100)" }}>
        {collectedPct > 0 && (
          <div
            className="h-full"
            style={{ width: `${collectedPct}%`, background: "var(--color-primary)" }}
          />
        )}
        {venuePct > 0 && (
          <div
            className="h-full"
            style={{ width: `${venuePct}%`, background: "var(--gray-400)" }}
          />
        )}
      </div>

      <div className="flex justify-between mt-2 text-[12px]">
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary tabular-nums">
            {formatMoney(collected)}
          </span>
          <span className="text-text-secondary">
            сборы · <span className="tabular-nums">{collectedPctRound}%</span>
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-semibold text-text-primary tabular-nums">
            {formatMoney(venuePaid)}
          </span>
          <span className="text-text-secondary">
            расходы · <span className="tabular-nums">{venuePctRound}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Debtor / creditor row ─── */

function DebtorRow({
  userId,
  name,
  amount,
  maxAmount,
  color,
  sign,
  onOpen,
}: {
  userId: string;
  name: string;
  amount: number;
  maxAmount: number;
  color: "danger" | "success";
  sign: string;
  onOpen: (id: string) => void;
}) {
  const rawPct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  const pct = Math.max(rawPct, 8); // visual minimum so smaller bars don't look empty
  return (
    <li>
      <button
        onClick={() => onOpen(userId)}
        className="w-full flex items-center gap-3 py-3 px-4 text-left"
      >
        <Avatar size="sm" name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium truncate">{name}</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${color === "danger" ? "bg-danger" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span
          className={`text-[14px] font-semibold tabular-nums shrink-0 ml-2 ${
            color === "danger" ? "text-danger" : "text-primary"
          }`}
        >
          {sign}{formatMoney(amount)}
        </span>
      </button>
    </li>
  );
}

/* ─── Venues accordion ─── */

function VenuesAccordion({
  teamId,
  events,
}: {
  teamId: string;
  events: FinancesData["venueEvents"];
}) {
  const [open, setOpen] = useState(false);
  const totalCost = events.reduce((s, e) => s + e.cost, 0);
  const totalPaid = events.reduce((s, e) => s + e.paid, 0);
  const totalDebt = Math.max(0, totalCost - totalPaid);

  return (
    <div className="bg-bg-primary rounded-[16px] overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left gap-3"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[14px] font-semibold leading-tight text-text-primary">
            Площадки · {events.length} {pluralize(events.length, ["событие", "события", "событий"])}
          </span>
          <span className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            Оплачено {formatMoney(totalPaid)} из {formatMoney(totalCost)}
            {totalDebt > 0 && <> · долг <span style={{ color: "var(--danger)" }}>{formatMoney(totalDebt)}</span></>}
          </span>
        </div>
        <span
          className="shrink-0 transition-transform"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            color: "var(--text-secondary)",
          }}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {events.map((v) => {
            const date = new Date(v.date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            });
            const remain = v.cost - v.paid;
            return (
              <li key={v.eventId}>
                <Link
                  href={`/team/${teamId}/events/${v.eventId}`}
                  className="flex items-center justify-between py-3 px-4 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">
                      {EVENT_TYPE_LABEL[v.type] ?? v.type} · {date}
                    </p>
                    {v.venueName && (
                      <p className="text-[12px] text-text-secondary mt-0.5 truncate">
                        {v.venueName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[14px] font-semibold tabular-nums shrink-0 ${
                      remain > 0 ? "text-danger" : "text-text-secondary"
                    }`}
                  >
                    {remain > 0 ? `−${formatMoney(remain)}` : "оплачено"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── Deposit card (inline) ─── */

function DepositCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm flex flex-col gap-3">
      <div>
        <p className="text-[14px] font-semibold text-text-primary">Депозит игрока</p>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Пополни баланс игрока, чтобы списывать оплату событий автоматически
        </p>
      </div>
      <Button variant="primary" className="w-full" onClick={onClick}>
        Внести депозит
      </Button>
    </div>
  );
}

/* ─── Deposit Modal ─── */

function DepositModal({
  teamId,
  organizerId,
  members,
  onClose,
  onSuccess,
}: {
  teamId: string;
  organizerId: string;
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [playerId, setPlayerId] = useState(members[0]?.user_id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputClass =
    "w-full bg-bg-card border border-border rounded-[10px] px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[13px] text-text-secondary mb-1 block";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!playerId || !Number.isFinite(a) || a <= 0) {
      setErr("Укажи игрока и сумму больше 0");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          amount: a,
          type: "deposit",
          note: note.trim() || null,
          confirmed_by: organizerId,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setErr(d.error ?? "Ошибка");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-bg-primary rounded-t-[20px] p-6 flex flex-col gap-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-[17px] font-semibold">Внести депозит</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        <div>
          <label className={labelClass}>Игрок</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-[10px] px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors text-text-primary"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Сумма, ₸</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Комментарий (опционально)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Предоплата за декабрь…"
            className={inputClass}
          />
        </div>

        {err && <p className="text-[13px] text-danger">{err}</p>}

        <Button type="submit" variant="primary" size="lg" loading={saving} className="w-full">
          Внести
        </Button>
      </form>
    </div>
  );
}
