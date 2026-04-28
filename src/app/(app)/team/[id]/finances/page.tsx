"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { PlayerCard } from "@/components/PlayerCard";
import { SkeletonCard } from "@/components/Skeleton";
import { CircularProgress } from "@/components/CircularProgress";
import { Avatar, Button, BottomActionBar, SectionEyebrow } from "@/components/ui";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatMoney } from "@/lib/format";

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
  finance30d: { netDelta: number; prevNetDelta: number } | null;
  financeFlowByMonth: FlowMonth[] | null;
};

type Member = { user_id: string; name: string };

function monthShort(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString("ru-RU", { month: "short" })
    .replace(".", "");
}

export default function TeamFinancesPage() {
  const team = useTeam();
  const auth = useAuth();
  const [data, setData] = useState<FinancesData | null>(null);
  const [insights, setInsights] = useState<InsightsFinance | null>(null);
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;

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

  useEffect(() => {
    if (!teamId || !showDeposit || members.length > 0) return;
    fetch(`/api/teams/${teamId}`)
      .then((r) => r.json())
      .then((d) => setMembers((d.members ?? []).map((m: { user: { id: string; name: string } }) => ({
        user_id: m.user.id,
        name: m.user.name,
      }))));
  }, [teamId, showDeposit, members.length]);

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
  const trendUp =
    insights?.finance30d != null
      ? insights.finance30d.netDelta >= insights.finance30d.prevNetDelta
      : null;
  const collectionPct =
    m.expected > 0 ? Math.round((m.collected / m.expected) * 100) : 0;

  return (
    <>
      <div className="flex flex-col gap-3 pb-24">
        {/* 1. Hero KPI */}
        <div className="bg-gray-900 rounded-[16px] p-5">
          <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-white/50 mb-1.5">
            Реальный баланс
          </p>
          <div className="flex items-end gap-2">
            <span
              className={`font-display text-[40px] font-bold tabular-nums leading-none ${
                m.realBalance >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {m.realBalance >= 0 ? "+" : ""}
              {formatMoney(m.realBalance)}
            </span>
            {trendUp !== null && (
              <span
                className={`mb-1 text-[18px] leading-none ${
                  trendUp ? "text-green-400" : "text-red-400"
                }`}
              >
                {trendUp ? "↑" : "↓"}
              </span>
            )}
          </div>
          {trendUp !== null && (
            <p className="text-[12px] text-white/40 mt-1">
              {trendUp ? "Лучше прошлого месяца" : "Хуже прошлого месяца"}
            </p>
          )}
          <div className="border-t border-white/10 mt-4 pt-4 grid grid-cols-3 gap-2">
            <HeroSegment label="Касса" value={formatMoney(m.cash)} />
            <HeroSegment
              label="Долги игр."
              value={formatMoney(m.playersDebt)}
              danger={m.playersDebt > 0}
            />
            <HeroSegment
              label="К оплате"
              value={formatMoney(m.venueOutstanding)}
              danger={m.venueOutstanding > 0}
            />
          </div>
        </div>

        {/* 2. Bar chart — поток за 6 месяцев */}
        {insights?.financeFlowByMonth && insights.financeFlowByMonth.length > 0 && (
          <FlowChart data={insights.financeFlowByMonth} />
        )}

        {/* 3. Donut — эффективность сборов */}
        {m.expected > 0 && (
          <CollectionDonut
            collected={m.collected}
            expected={m.expected}
            percent={collectionPct}
          />
        )}

        {/* 4. Должники */}
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
                  maxAmount={data.debtors[0].amount}
                  color="danger"
                  sign="−"
                  onOpen={setOpenPlayerId}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 5. Переплатили */}
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
                  maxAmount={data.creditors[0].amount}
                  color="success"
                  sign="+"
                  onOpen={setOpenPlayerId}
                />
              ))}
            </ul>
          </div>
        )}

        {/* 6. Расходы по площадкам */}
        {data.venueEvents.length > 0 && (
          <div className="bg-bg-primary rounded-[16px] overflow-hidden shadow-sm">
            <div className="px-4 pt-4 pb-1">
              <SectionEyebrow>Площадки</SectionEyebrow>
            </div>
            <ul className="divide-y divide-gray-100">
              {data.venueEvents.map((v) => {
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
          </div>
        )}
      </div>

      <BottomActionBar>
        <Button variant="primary" className="w-full" onClick={() => setShowDeposit(true)}>
          Внести депозит
        </Button>
      </BottomActionBar>

      {teamId && userId && openPlayerId && (
        <PlayerCard
          teamId={teamId}
          requesterId={userId}
          targetUserId={openPlayerId}
          onClose={() => setOpenPlayerId(null)}
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
      <span className="text-[10px] text-white/40 uppercase tracking-[0.05em] truncate">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums truncate ${danger ? "text-red-400" : "text-white/80"}`}>
        {value}
      </span>
    </div>
  );
}

/* ─── Flow bar chart ─── */

function FlowChart({ data }: { data: FlowMonth[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.collected, d.venuePaid]), 1);
  const CHART_H = 56;
  const BAR_W = 10;
  const PAIR_GAP = 2;
  const COLS = data.length;
  const COL_W = 44;
  const TOTAL_W = COLS * COL_W;

  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
      <p className="text-[13px] font-semibold text-text-primary mb-3">Поток за 6 месяцев</p>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${CHART_H + 18}`}
        className="w-full"
        style={{ height: `${CHART_H + 18}px` }}
      >
        {data.map((d, i) => {
          const cx = i * COL_W + COL_W / 2;
          const ch = Math.max((d.collected / maxVal) * CHART_H, 2);
          const vh = Math.max((d.venuePaid / maxVal) * CHART_H, 2);
          return (
            <g key={d.month}>
              <rect
                x={cx - BAR_W - PAIR_GAP / 2}
                y={CHART_H - ch}
                width={BAR_W}
                height={ch}
                rx={2}
                fill="var(--color-primary)"
                opacity={0.85}
              />
              <rect
                x={cx + PAIR_GAP / 2}
                y={CHART_H - vh}
                width={BAR_W}
                height={vh}
                rx={2}
                fill="var(--color-border)"
              />
              <text
                x={cx}
                y={CHART_H + 13}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-text-secondary)"
              >
                {monthShort(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
          Сборы
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span className="w-2 h-2 rounded-sm bg-border inline-block" />
          Площадки
        </span>
      </div>
    </div>
  );
}

/* ─── Collection donut ─── */

function CollectionDonut({
  collected,
  expected,
  percent,
}: {
  collected: number;
  expected: number;
  percent: number;
}) {
  return (
    <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm flex items-center gap-4">
      <div className="relative shrink-0">
        <CircularProgress value={percent} size={80} strokeWidth={7} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[18px] font-bold text-text-primary tabular-nums">
            {percent}%
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-text-primary">Эффективность сборов</p>
        <p className="text-[13px] text-text-secondary mt-1">
          Собрано {formatMoney(collected)}
          <br />
          из {formatMoney(expected)}
        </p>
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
  const pct = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
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
