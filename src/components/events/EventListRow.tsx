"use client";

import Link from "next/link";
import { memo } from "react";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatMoney } from "@/lib/format";

type Props = {
  id: string;
  teamId: string;
  teamName: string | null;
  /** Overrides teamName as the primary title. Useful in team-scoped lists. */
  title?: string;
  type: string;
  date: string;
  venueName: string | null;
  venueAddress: string | null;
  yesCount: number;
  pricePerPlayer: number;
  myTeam?: boolean;
  /** Hide private indicator when undefined; show "Приватное" badge when false. */
  isPublic?: boolean;
};

const MONTH_SHORT_UPPER = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

const WEEKDAY_SHORT_UPPER = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

type TypeAccent = {
  /** Date-block top strip + chip text. */
  strong: string;
  /** Type chip soft background. */
  soft: string;
};

const TYPE_ACCENT: Record<string, TypeAccent> = {
  game:       { strong: "var(--green-700)",   soft: "var(--green-50)" },
  training:   { strong: "var(--pos-gk-fg)",   soft: "var(--pos-gk-bg)" },
  gathering:  { strong: "var(--warning)",     soft: "var(--warning-soft)" },
  other:      { strong: "var(--ink-700)",     soft: "var(--ink-100)" },
};

function formatDateBlock(iso: string): {
  weekday: string;
  day: string;
  month: string;
  time: string;
} {
  const d = new Date(iso);
  return {
    weekday: WEEKDAY_SHORT_UPPER[d.getDay()],
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTH_SHORT_UPPER[d.getMonth()],
    time: `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes(),
    ).padStart(2, "0")}`,
  };
}

function EventListRowImpl({
  id,
  teamId,
  teamName,
  title,
  type,
  date,
  venueName,
  venueAddress,
  yesCount,
  pricePerPlayer,
  myTeam,
  isPublic,
}: Props) {
  const { weekday, day, month, time } = formatDateBlock(date);
  const typeLabel = EVENT_TYPE_LABEL[type] ?? type;
  const accent = TYPE_ACCENT[type] ?? TYPE_ACCENT.other;
  const primary = title ?? teamName ?? "Без команды";
  const subtitle = [venueName, venueAddress].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/team/${teamId}/events/${id}`}
      className="flex items-center gap-3.5 px-4 py-3 last:border-b-0 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--ink-100)" }}
    >
      <DateBlock
        weekday={weekday}
        day={day}
        month={month}
        time={time}
        accent={accent.strong}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TypeChip label={typeLabel} accent={accent} />
          {myTeam && <RoleBadge>Моя команда</RoleBadge>}
          {isPublic === false && <PrivateBadge />}
        </div>
        <h3
          className="text-[16px] font-semibold truncate leading-[1.2]"
          style={{ color: "var(--ink-900)" }}
        >
          {primary}
        </h3>
        {subtitle && (
          <p
            className="text-[13px] truncate"
            style={{ color: "var(--ink-500)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-center gap-1">
        <span
          className="inline-flex items-center gap-1 tabular-nums text-[14px] font-semibold"
          style={{ color: "var(--green-700)" }}
        >
          <PeopleIcon />
          {yesCount}
        </span>
        <span
          className="text-[14px] font-bold tabular-nums"
          style={{
            color:
              pricePerPlayer > 0 ? "var(--ink-900)" : "var(--ink-500)",
          }}
        >
          {pricePerPlayer > 0 ? formatMoney(pricePerPlayer) : "Бесплатно"}
        </span>
      </div>
    </Link>
  );
}

export const EventListRow = memo(EventListRowImpl);

function DateBlock({
  weekday,
  day,
  month,
  time,
  accent,
}: {
  weekday: string;
  day: string;
  month: string;
  time: string;
  accent: string;
}) {
  return (
    <div
      className="shrink-0 w-[60px] rounded-[14px] overflow-hidden flex flex-col"
      style={{
        background: "var(--card)",
        border: "1px solid var(--ink-200)",
      }}
    >
      <div
        className="text-center font-bold uppercase"
        style={{
          padding: "3px 0",
          background: accent,
          color: "#fff",
          fontSize: 10,
          letterSpacing: "0.1em",
        }}
      >
        {weekday}
      </div>
      <div
        className="text-center tabular-nums leading-none"
        style={{
          padding: "6px 0 1px",
          fontSize: 24,
          fontWeight: 700,
          color: "var(--ink-900)",
        }}
      >
        {day}
      </div>
      <div
        className="text-center uppercase"
        style={{
          padding: "0 0 5px",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--ink-500)",
          letterSpacing: "0.08em",
        }}
      >
        {month}
      </div>
      <div
        className="text-center tabular-nums"
        style={{
          padding: "4px 0",
          borderTop: "1px solid var(--ink-100)",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--green-700)",
          letterSpacing: "0.02em",
        }}
      >
        {time}
      </div>
    </div>
  );
}

function TypeChip({ label, accent }: { label: string; accent: TypeAccent }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
      style={{
        background: accent.soft,
        color: accent.strong,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: "var(--green-50)", color: "var(--green-800)" }}
    >
      {children}
    </span>
  );
}

function PrivateBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: "var(--ink-100)", color: "var(--ink-500)" }}
    >
      <LockIcon />
      Приватное
    </span>
  );
}

function LockIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
