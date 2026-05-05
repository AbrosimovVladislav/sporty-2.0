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
  /** Hide private indicator when undefined; show "Приватное" badge when false. */
  isPublic?: boolean;
};

const MONTH_SHORT_UPPER = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

const WEEKDAY_SHORT_UPPER = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

type ChipColor = { bg: string; fg: string };

const TYPE_CHIP: Record<string, ChipColor> = {
  game:      { bg: "var(--danger-soft)",  fg: "var(--danger)" },
  training:  { bg: "var(--pos-gk-bg)",    fg: "var(--pos-gk-fg)" },
  gathering: { bg: "var(--warning-soft)", fg: "var(--warning)" },
  other:     { bg: "var(--green-50)",     fg: "var(--green-700)" },
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
    day: String(d.getDate()),
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
  isPublic,
}: Props) {
  const { weekday, day, month, time } = formatDateBlock(date);
  const typeLabel = EVENT_TYPE_LABEL[type] ?? type;
  const chip = TYPE_CHIP[type] ?? TYPE_CHIP.other;
  const primary = title ?? teamName ?? "Без команды";

  return (
    <Link
      href={`/team/${teamId}/events/${id}`}
      className="flex items-stretch gap-3 px-4 py-3.5 last:border-b-0 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--ink-100)" }}
    >
      <DateBlock weekday={weekday} day={day} month={month} time={time} />

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3
            className="text-[16px] font-semibold truncate leading-[1.2]"
            style={{ color: "var(--ink-900)" }}
          >
            {primary}
          </h3>
          <TypeChip label={typeLabel} chip={chip} />
        </div>
        {venueName && (
          <p
            className="text-[14px] truncate leading-tight"
            style={{ color: "var(--ink-900)" }}
          >
            {venueName}
          </p>
        )}
        {venueAddress && (
          <p
            className="text-[12px] truncate leading-tight"
            style={{ color: "var(--ink-400)" }}
          >
            {venueAddress}
          </p>
        )}
        {isPublic === false && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <PrivateBadge />
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-between py-0.5">
        <PeoplePill count={yesCount} />
        <span
          className="text-[14px] font-bold tabular-nums whitespace-nowrap"
          style={{
            color:
              pricePerPlayer > 0 ? "var(--ink-900)" : "var(--ink-500)",
          }}
        >
          {pricePerPlayer > 0 ? formatMoney(pricePerPlayer) : "Бесплатно"}
        </span>
      </div>

      <ChevronRight />
    </Link>
  );
}

export const EventListRow = memo(EventListRowImpl);

function DateBlock({
  weekday,
  day,
  month,
  time,
}: {
  weekday: string;
  day: string;
  month: string;
  time: string;
}) {
  return (
    <div
      className="shrink-0 w-[44px] pr-3 flex flex-col items-center justify-center text-center"
      style={{ borderRight: "1px solid var(--ink-100)" }}
    >
      <div
        className="tabular-nums leading-none"
        style={{
          fontFamily: "var(--font-oswald)",
          fontSize: 28,
          fontWeight: 600,
          color: "var(--ink-900)",
        }}
      >
        {day}
      </div>
      <div
        className="uppercase mt-1.5"
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--ink-500)",
          letterSpacing: "0.06em",
        }}
      >
        {month} · {weekday}
      </div>
      <div
        className="tabular-nums mt-1.5"
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-400)",
        }}
      >
        {time}
      </div>
    </div>
  );
}

function TypeChip({ label, chip }: { label: string; chip: ChipColor }) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: chip.bg, color: chip.fg }}
    >
      {label}
    </span>
  );
}

function PeoplePill({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums"
      style={{
        border: "1px solid var(--ink-200)",
        color: "var(--ink-700)",
        background: "var(--card)",
      }}
    >
      <PeopleIcon />
      {count}
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
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-400)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 self-center"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
