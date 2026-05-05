"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import { teamFallbackHue } from "@/lib/playerBadges";
import type { FinancesHistoryEntry, FinancesPayload } from "./types";
import { Card, Eyebrow, SkeletonBlock } from "./atoms";

export function FinancesTab({ userId }: { userId: string }) {
  const [data, setData] = useState<FinancesPayload | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/finances`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: FinancesPayload | null) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (data === undefined) return <SkeletonBlock />;
  if (data === null) {
    return (
      <Card className="p-5 text-center">
        <p
          className="text-[15px]"
          style={{ color: "var(--ink-500)" }}
        >
          Не удалось загрузить финансы
        </p>
      </Card>
    );
  }

  const { teams, totals, history } = data;
  const hasAnyActivity = teams.length > 0 && (totals.expected > 0 || totals.paid > 0);

  if (!hasAnyActivity) {
    return (
      <Card className="p-6 text-center">
        <p
          className="text-[16px] font-bold mb-1.5"
          style={{ color: "var(--ink-900)" }}
        >
          Пока нет финансовой активности
        </p>
        <p
          className="text-[14px] leading-normal"
          style={{ color: "var(--ink-500)" }}
        >
          Здесь появятся балансы по командам, история взносов и депозитов после
          первых событий.
        </p>
      </Card>
    );
  }

  return (
    <>
      <SummaryCard balance={totals.balance} />

      {teams.length > 0 && (
        <div>
          <Eyebrow className="mb-2 px-1">Балансы по командам</Eyebrow>
          <Card className="overflow-hidden">
            {teams.map((t, i) => {
              const isLast = i === teams.length - 1;
              return (
                <Link
                  key={t.team_id}
                  href={`/team/${t.team_id}/finances`}
                  className="flex items-center gap-3 px-4 py-3.5 active:opacity-70"
                  style={{
                    borderBottom: isLast
                      ? undefined
                      : "1px solid var(--ink-100)",
                  }}
                >
                  <TeamLogo
                    id={t.team_id}
                    name={t.team_name}
                    logoUrl={t.team_logo_url}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[15px] font-semibold truncate leading-tight"
                      style={{ color: "var(--ink-900)" }}
                    >
                      {t.team_name}
                    </p>
                    <p
                      className="text-[12px] mt-0.5"
                      style={{ color: "var(--ink-500)" }}
                    >
                      {balanceHint(t.balance)}
                    </p>
                  </div>
                  <BalanceValue value={t.balance} />
                </Link>
              );
            })}
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <Eyebrow className="mb-2 px-1">История</Eyebrow>
          <Card className="overflow-hidden">
            {history.map((h, i) => (
              <HistoryRow
                key={h.id}
                entry={h}
                isLast={i === history.length - 1}
              />
            ))}
          </Card>
        </div>
      )}
    </>
  );
}

function SummaryCard({ balance }: { balance: number }) {
  const isPositive = balance >= 0;
  const valueColor = balance < 0 ? "var(--danger)" : "var(--green-700)";
  const label = balance > 0
    ? "Команды должны вам"
    : balance < 0
      ? "Вы должны командам"
      : "Все расчёты сведены";
  return (
    <Card className="p-5">
      <Eyebrow className="mb-2">Общий баланс</Eyebrow>
      <p
        className="font-display text-[40px] font-bold leading-none tabular-nums"
        style={{ color: valueColor }}
      >
        {isPositive ? "+" : ""}
        {formatMoney(balance)}
      </p>
      <p
        className="text-[13px] mt-2"
        style={{ color: "var(--ink-500)" }}
      >
        {label}
      </p>
    </Card>
  );
}

function BalanceValue({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span
        className="text-[14px] font-semibold tabular-nums whitespace-nowrap"
        style={{ color: "var(--ink-500)" }}
      >
        0 ₸
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span
      className="text-[15px] font-bold tabular-nums whitespace-nowrap"
      style={{
        color: isPositive ? "var(--green-700)" : "var(--danger)",
      }}
    >
      {isPositive ? "+" : ""}
      {formatMoney(value)}
    </span>
  );
}

function balanceHint(balance: number): string {
  if (balance > 0) return "Команда должна вам";
  if (balance < 0) return "Вы должны команде";
  return "Расчёт сведён";
}

function TeamLogo({
  id,
  name,
  logoUrl,
}: {
  id: string;
  name: string;
  logoUrl: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (logoUrl) {
    return (
      <span
        className="inline-block rounded-[10px] overflow-hidden bg-white shrink-0"
        style={{ width: 36, height: 36 }}
      >
        <Image
          src={logoUrl}
          alt={name}
          width={36}
          height={36}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }
  const hue = teamFallbackHue(id);
  return (
    <span
      className="inline-flex items-center justify-center rounded-[10px] text-white font-display font-extrabold shrink-0"
      style={{
        width: 36,
        height: 36,
        background: `oklch(0.55 0.15 ${hue})`,
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

function HistoryRow({
  entry,
  isLast,
}: {
  entry: FinancesHistoryEntry;
  isLast: boolean;
}) {
  const isExpense = entry.kind === "event_expense";
  const isCredit = entry.amount > 0;
  const valueColor = isCredit
    ? "var(--green-700)"
    : isExpense
      ? "var(--danger)"
      : "var(--ink-900)";
  const sign = entry.amount > 0 ? "+" : entry.amount < 0 ? "−" : "";
  const valueText = `${sign}${formatMoney(Math.abs(entry.amount))}`;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5"
      style={{
        borderBottom: isLast ? undefined : "1px solid var(--ink-100)",
      }}
    >
      <HistoryIcon kind={entry.kind} />
      <div className="min-w-0 flex-1">
        <p
          className="text-[14px] font-semibold leading-tight truncate"
          style={{ color: "var(--ink-900)" }}
        >
          {entry.label}
        </p>
        <p
          className="text-[12px] mt-1"
          style={{ color: "var(--ink-400)" }}
        >
          {entry.team_name ?? "Команда"} · {formatRelative(entry.date)}
        </p>
      </div>
      <span
        className="text-[14px] font-bold tabular-nums whitespace-nowrap"
        style={{ color: valueColor }}
      >
        {valueText}
      </span>
    </div>
  );
}

function HistoryIcon({ kind }: { kind: FinancesHistoryEntry["kind"] }) {
  const cfg =
    kind === "deposit"
      ? {
          bg: "var(--green-50)",
          fg: "var(--green-700)",
          path: (
            <>
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="5 12 12 5 19 12" />
            </>
          ),
        }
      : kind === "event_expense"
        ? {
            bg: "var(--danger-soft)",
            fg: "var(--danger)",
            path: (
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </>
            ),
          }
        : {
            bg: "var(--ink-100)",
            fg: "var(--ink-500)",
            path: (
              <>
                <polyline points="9 12 11 14 15 10" />
                <circle cx="12" cy="12" r="9" />
              </>
            ),
          };

  return (
    <span
      className="inline-flex items-center justify-center rounded-[10px] shrink-0 mt-0.5"
      style={{
        width: 32,
        height: 32,
        background: cfg.bg,
        color: cfg.fg,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {cfg.path}
      </svg>
    </span>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
