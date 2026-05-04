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
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЯ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

const WEEKDAY_SHORT_UPPER = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

type ChipStyle = { bg: string; color: string; border: string };

const TYPE_CHIP_STYLE: Record<string, ChipStyle> = {
  game: {
    bg: "var(--green-100)",
    color: "var(--green-700)",
    border: "var(--green-200)",
  },
  training: {
    bg: "oklch(0.95 0.03 240)",
    color: "oklch(0.45 0.14 240)",
    border: "oklch(0.88 0.06 240)",
  },
  gathering: {
    bg: "oklch(0.95 0.03 75)",
    color: "oklch(0.52 0.14 75)",
    border: "oklch(0.88 0.08 75)",
  },
  other: {
    bg: "var(--gray-100)",
    color: "var(--gray-600)",
    border: "var(--gray-200)",
  },
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
  const chip = TYPE_CHIP_STYLE[type] ?? TYPE_CHIP_STYLE.other;
  const primary = title ?? teamName ?? "Без команды";

  return (
    <Link
      href={`/team/${teamId}/events/${id}`}
      className="flex gap-3 py-3.5 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <div
        className="shrink-0 w-[72px] flex flex-col items-center overflow-hidden"
        style={{
          borderRadius: 14,
          background: "var(--bg-card)",
          border: "1.5px solid var(--border)",
        }}
      >
        <div
          className="w-full text-center font-display uppercase"
          style={{
            padding: "5px 0 3px",
            background: "var(--green-600)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
          }}
        >
          {weekday}
        </div>
        <div
          className="text-center font-display tabular-nums"
          style={{
            padding: "5px 0 0",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {day}
        </div>
        <div
          className="text-center uppercase"
          style={{
            padding: "1px 0 4px",
            fontSize: 9,
            fontWeight: 700,
            color: "var(--text-tertiary)",
            letterSpacing: "0.06em",
          }}
        >
          {month}
        </div>
        <div
          className="w-full text-center font-display tabular-nums"
          style={{
            padding: "4px 0 6px",
            borderTop: "1px solid var(--border)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--green-700)",
            letterSpacing: "0.02em",
          }}
        >
          {time}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col self-stretch gap-[3px]">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex shrink-0"
            style={{
              padding: "3px 8px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
              background: chip.bg,
              color: chip.color,
              border: `1px solid ${chip.border}`,
            }}
          >
            {typeLabel}
          </span>
          {myTeam && (
            <span
              className="inline-flex shrink-0"
              style={{
                padding: "2px 7px",
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                background: "var(--green-50)",
                color: "var(--green-700)",
                border: "1px solid var(--green-200)",
              }}
            >
              Моя команда
            </span>
          )}
          {isPublic === false && (
            <span
              className="inline-flex items-center gap-1 shrink-0"
              style={{
                padding: "2px 7px",
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                background: "var(--gray-100)",
                color: "var(--text-secondary)",
                border: "1px solid var(--gray-200)",
              }}
            >
              <LockIcon />
              Приватное
            </span>
          )}
        </div>
        <div
          className="text-[16px] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {primary}
        </div>
        <div className="flex-1" />
        {venueName && (
          <div
            className="text-[13px] truncate"
            style={{ color: "var(--text-secondary)" }}
          >
            {venueName}
          </div>
        )}
        {venueAddress && (
          <div
            className="text-[12px] truncate"
            style={{ color: "var(--text-tertiary)" }}
          >
            {venueAddress}
          </div>
        )}
      </div>

      <div className="shrink-0 w-[70px] flex flex-col items-end justify-between self-stretch">
        <span
          className="inline-flex items-center gap-[3px] tabular-nums"
          style={{
            color: "var(--green-600)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <PeopleIcon />
          {yesCount}
        </span>
        {pricePerPlayer > 0 ? (
          <span
            className="text-[13px] font-semibold tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            {formatMoney(pricePerPlayer)}
          </span>
        ) : (
          <span />
        )}
      </div>
    </Link>
  );
}

export const EventListRow = memo(EventListRowImpl);

function LockIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
