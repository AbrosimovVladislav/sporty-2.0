"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { PlayerCard } from "@/components/PlayerCard";
import { SkeletonCard } from "@/components/Skeleton";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import {
  StatCard,
  MiniStatCard,
  Card,
  Button,
  BottomActionBar,
  SectionEyebrow,
  Avatar,
} from "@/components/ui";

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

type Member = { user_id: string; name: string };

export default function TeamFinancesPage() {
  const team = useTeam();
  const auth = useAuth();
  const [data, setData] = useState<FinancesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;

  const load = () => {
    if (!teamId || !userId) return;
    fetch(`/api/teams/${teamId}/finances?userId=${userId}`)
      .then(async (r) => {
        if (!r.ok) { setError("Доступ запрещён"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => setError("Не удалось загрузить"));
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
      <Card>
        <p className="text-[15px] text-foreground-secondary text-center">{error}</p>
      </Card>
    ) : (
      <SkeletonCard className="h-28" />
    );
  }

  if (team.status !== "ready" || team.role !== "organizer") return null;

  const m = data.metrics;
  const hasDebtors = data.debtors.length > 0 || data.creditors.length > 0;

  return (
    <>
      <div className="flex flex-col gap-3 pb-24">
        {/* Реальный баланс */}
        <StatCard
          label="Реальный баланс"
          value={`${m.realBalance >= 0 ? "+" : ""}${m.realBalance} ₸`}
          color={m.realBalance >= 0 ? "primary" : "danger"}
        />

        {/* Мини-метрики */}
        <div className="grid grid-cols-2 gap-3">
          <MiniStatCard
            label="Долги игроков"
            value={`${m.playersDebt} ₸`}
            color={m.playersDebt > 0 ? "danger" : "default"}
          />
          <MiniStatCard
            label="К оплате площадкам"
            value={`${m.venueOutstanding} ₸`}
            color={m.venueOutstanding > 0 ? "warning" : "default"}
          />
        </div>

        {/* Касса */}
        <Card>
          <SectionEyebrow tone="muted">Касса</SectionEyebrow>
          <MetricRow label="На руках" value={`${m.cash} ₸`} />
        </Card>

        {/* Сборы */}
        <Card>
          <SectionEyebrow tone="muted">Сборы</SectionEyebrow>
          <div className="divide-y divide-border">
            <MetricRow label="Ожидаемый сбор" value={`${m.expected} ₸`} muted />
            <MetricRow label="Собрано от игроков" value={`${m.collected} ₸`} />
          </div>
        </Card>

        {/* Расходы площадкам */}
        <Card>
          <SectionEyebrow tone="muted">Расходы площадкам</SectionEyebrow>
          <div className="divide-y divide-border">
            <MetricRow label="Всего расходов" value={`${m.venueCostTotal} ₸`} muted />
            <MetricRow label="Оплачено" value={`${m.venuePaidTotal} ₸`} muted />
            <MetricRow label="Остаток к оплате" value={`${m.venueOutstanding} ₸`} />
          </div>
        </Card>

        {/* Задолженности */}
        {hasDebtors && (
          <Card padding="sm">
            <SectionEyebrow tone="muted" className="px-1 pt-1">Задолженности игроков</SectionEyebrow>
            <ul className="divide-y divide-border">
              {data.debtors.map((d) => (
                <li key={`debt-${d.userId}`}>
                  <button
                    onClick={() => setOpenPlayerId(d.userId)}
                    className="w-full flex items-center gap-3 py-3 px-1 text-left"
                  >
                    <Avatar size="sm" name={d.name} />
                    <span className="flex-1 text-[15px] font-medium truncate">{d.name}</span>
                    <span className="text-[15px] font-semibold tabular-nums text-danger">−{d.amount} ₸</span>
                  </button>
                </li>
              ))}
              {data.creditors.map((c) => (
                <li key={`cred-${c.userId}`}>
                  <button
                    onClick={() => setOpenPlayerId(c.userId)}
                    className="w-full flex items-center gap-3 py-3 px-1 text-left"
                  >
                    <Avatar size="sm" name={c.name} />
                    <span className="flex-1 text-[15px] font-medium truncate">{c.name}</span>
                    <span className="text-[15px] font-semibold tabular-nums text-primary">+{c.amount} ₸</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Площадки */}
        {data.venueEvents.length > 0 && (
          <Card padding="sm">
            <SectionEyebrow tone="muted" className="px-1 pt-1">Площадки</SectionEyebrow>
            <ul className="divide-y divide-border">
              {data.venueEvents.map((v) => {
                const date = new Date(v.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
                const remain = v.cost - v.paid;
                return (
                  <li key={v.eventId}>
                    <Link
                      href={`/team/${teamId}/events/${v.eventId}`}
                      className="flex items-center justify-between py-3 px-1 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium truncate">
                          {EVENT_TYPE_LABEL[v.type] ?? v.type} · {date}
                        </p>
                        {v.venueName && (
                          <p className="text-[13px] text-foreground-secondary mt-0.5 truncate">{v.venueName}</p>
                        )}
                      </div>
                      <span className={`text-[15px] font-semibold tabular-nums shrink-0 ${remain > 0 ? "text-danger" : "text-primary"}`}>
                        {remain > 0 ? `−${remain} ₸` : "оплачено"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {/* Deposit bottom bar */}
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

  const inputClass = "w-full bg-background-card border border-border rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[13px] text-foreground-secondary mb-1 block";

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
        body: JSON.stringify({ player_id: playerId, amount: a, type: "deposit", note: note.trim() || null, confirmed_by: organizerId }),
      });
      if (res.ok) { onSuccess(); }
      else { const d = await res.json(); setErr(d.error ?? "Ошибка"); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background-overlay" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-background-card rounded-t-xl p-6 flex flex-col gap-4 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-[17px] font-semibold">Внести депозит</h2>
          <button type="button" onClick={onClose} className="text-foreground-secondary text-2xl leading-none px-2">×</button>
        </div>

        <div>
          <label className={labelClass}>Игрок</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full bg-background-card border border-border rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors text-foreground"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.name}</option>
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

/* ─── MetricRow ─── */

function MetricRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between py-2.5 text-[15px] ${muted ? "text-foreground-secondary" : ""}`}>
      <span className="text-foreground-secondary">{label}</span>
      <span className={muted ? "" : "font-medium tabular-nums"}>{value}</span>
    </div>
  );
}
