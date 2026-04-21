"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam } from "../team-context";
import { PlayerCard } from "@/components/PlayerCard";
import { SkeletonCard } from "@/components/Skeleton";

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

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
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        {error}
      </section>
    ) : (
      <SkeletonCard className="h-28" />
    );
  }

  if (team.status !== "ready" || team.role !== "organizer") return null;

  const m = data.metrics;

  return (
    <>
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary">Реальный баланс</p>
        <p className={`text-3xl font-display font-bold mt-1 ${m.realBalance >= 0 ? "text-green-600" : "text-red-500"}`}>
          {m.realBalance >= 0 ? "+" : ""}{m.realBalance} ₽
        </p>
        <p className="text-xs text-foreground-secondary mt-1">
          Что останется команде, когда все долги закрыты и площадки оплачены
        </p>
      </section>

      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Показатели</p>
        <Row label="Касса (на руках)" value={`${m.cash} ₽`} />
        <Row label="Собрано от игроков" value={`${m.collected} ₽`} />
        <Row label="Ожидаемый сбор" value={`${m.expected} ₽`} muted />
        <Row label="Расходы площадкам" value={`${m.venueCostTotal} ₽`} />
        <Row label="Оплачено площадкам" value={`${m.venuePaidTotal} ₽`} muted />
        <Row label="Остаток к оплате" value={`${m.venueOutstanding} ₽`} />
        <Row label="Долги игроков" value={`${m.playersDebt} ₽`} />
        <Row label="Переплаты игроков" value={`${m.playersOverpaid} ₽`} />
      </section>

      {(data.debtors.length > 0 || data.creditors.length > 0) && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Задолженности игроков</p>
          <ul className="flex flex-col gap-2">
            {data.debtors.map((d) => (
              <li key={`debt-${d.userId}`}>
                <button
                  onClick={() => setOpenPlayerId(d.userId)}
                  className="w-full flex items-center justify-between py-2 border-b border-border last:border-b-0 text-left"
                >
                  <span className="text-sm">{d.name}</span>
                  <span className="text-sm font-medium text-red-500">−{d.amount} ₽</span>
                </button>
              </li>
            ))}
            {data.creditors.map((c) => (
              <li key={`cred-${c.userId}`}>
                <button
                  onClick={() => setOpenPlayerId(c.userId)}
                  className="w-full flex items-center justify-between py-2 border-b border-border last:border-b-0 text-left"
                >
                  <span className="text-sm">{c.name}</span>
                  <span className="text-sm font-medium text-green-600">+{c.amount} ₽</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-foreground-secondary mt-2">«−» — игрок должен команде, «+» — переплатил</p>
        </section>
      )}

      {data.venueEvents.length > 0 && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Площадки</p>
          <ul className="flex flex-col gap-2">
            {data.venueEvents.map((v) => {
              const date = new Date(v.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
              const remain = v.cost - v.paid;
              return (
                <li key={v.eventId}>
                  <Link href={`/team/${teamId}/events/${v.eventId}`} className="block py-2 border-b border-border last:border-b-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium">{TYPE_LABEL[v.type] ?? v.type} · {date}</span>
                      <span className={`text-xs font-medium ${remain > 0 ? "text-red-500" : "text-green-600"}`}>
                        {remain > 0 ? `−${remain} ₽` : "оплачено"}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {v.venueName ? `${v.venueName} · ` : ""}{v.paid} из {v.cost} ₽
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Deposit button */}
      <button
        onClick={() => setShowDeposit(true)}
        className="w-full bg-background-card border border-border rounded-lg p-4 text-sm font-display font-semibold uppercase text-primary text-center"
      >
        + Внести депозит
      </button>

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-background border-t border-border rounded-t-2xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold uppercase">Депозит</h2>
          <button type="button" onClick={onClose} className="text-foreground-secondary text-2xl leading-none px-2">×</button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground-secondary">Игрок</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="bg-background-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground-secondary">Сумма, ₽</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            className="bg-background-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground-secondary">Комментарий (опционально)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Предоплата за декабрь…"
            className="bg-background-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {err && <p className="text-sm text-red-500">{err}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full py-3 disabled:opacity-50"
        >
          {saving ? "Сохраняю…" : "Внести"}
        </button>
      </form>
    </div>
  );
}

/* ─── Row ─── */

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-foreground-secondary" : ""}`}>
      <span className="text-foreground-secondary">{label}</span>
      <span className={muted ? "" : "font-medium"}>{value}</span>
    </div>
  );
}
