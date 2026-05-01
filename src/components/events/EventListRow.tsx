"use client";

import Link from "next/link";
import { memo } from "react";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";

type Props = {
  id: string;
  teamId: string;
  teamName: string | null;
  /** Overrides teamName as the primary title. Useful in team-scoped lists. */
  title?: string;
  type: string;
  date: string;
  venueName: string | null;
  venueDistrict: string | null;
  venueCity: string | null;
  yesCount: number;
  pricePerPlayer: number;
  myTeam?: boolean;
};

const MONTH_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

function formatDateBlock(iso: string): { day: string; month: string; time: string } {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTH_SHORT[d.getMonth()];
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return { day, month, time };
}

function EventListRowImpl({
  id,
  teamId,
  teamName,
  title,
  type,
  date,
  venueName,
  venueDistrict,
  venueCity,
  yesCount,
  pricePerPlayer,
  myTeam,
}: Props) {
  const { day, month, time } = formatDateBlock(date);
  const venueLine = [venueName, venueDistrict || venueCity]
    .filter(Boolean)
    .join(" · ");
  const typeLabel = EVENT_TYPE_LABEL[type] ?? type;

  return (
    <Link
      href={`/team/${teamId}/events/${id}`}
      className="flex items-stretch gap-3.5 py-3 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <div
        className="w-11 h-11 rounded-[12px] flex flex-col items-center justify-center shrink-0"
        style={{
          background: "var(--green-50)",
          color: "var(--green-700)",
        }}
      >
        <span className="font-display text-[16px] font-bold leading-none tabular-nums">
          {day}
        </span>
        <span className="text-[9px] font-semibold uppercase mt-0.5 leading-none">
          {month}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[15px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {title ?? teamName ?? "Без команды"}
          </span>
          {myTeam && <RoleBadge>Моя команда</RoleBadge>}
        </div>
        <p
          className="text-[13px] truncate mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {typeLabel} · {time}
          {venueLine ? ` · ${venueLine}` : ""}
        </p>
      </div>

      <div
        className="shrink-0 flex flex-col items-end justify-center gap-0.5"
        style={{ color: "var(--text-secondary)" }}
      >
        <div className="flex items-center gap-1">
          <CheckIcon />
          <span className="text-[14px] font-semibold tabular-nums">
            {yesCount}
          </span>
        </div>
        {pricePerPlayer > 0 && (
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            {pricePerPlayer} ₸
          </span>
        )}
      </div>
    </Link>
  );
}

export const EventListRow = memo(EventListRowImpl);

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
      style={{ background: "var(--green-50)", color: "var(--green-700)" }}
    >
      {children}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
