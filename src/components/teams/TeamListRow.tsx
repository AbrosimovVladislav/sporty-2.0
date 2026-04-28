"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui";
import { SPORT_LABEL } from "@/lib/catalogs";

type Props = {
  id: string;
  name: string;
  sport: string;
  city: string;
  district?: string | null;
  membersCount: number;
  lookingForPlayers?: boolean;
  myRole?: "organizer" | "player" | null;
  logoUrl?: string | null;
};

export function TeamListRow({
  id,
  name,
  sport,
  city,
  district,
  membersCount,
  lookingForPlayers,
  myRole,
  logoUrl,
}: Props) {
  const subtitle = [SPORT_LABEL[sport] ?? sport, district || city]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/team/${id}`}
      className="flex items-center gap-3.5 py-3 last:border-b-0 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <Avatar name={name} src={logoUrl} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[15px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </span>
          {myRole === "organizer" ? (
            <RoleBadge>Капитан</RoleBadge>
          ) : myRole === "player" ? (
            <RoleBadge>Я в составе</RoleBadge>
          ) : lookingForPlayers ? (
            <SeekingBadge>Ищут игроков</SeekingBadge>
          ) : null}
        </div>
        {subtitle && (
          <p
            className="text-[13px] truncate mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="shrink-0 flex items-center gap-1.5"
        aria-label={`${membersCount} участников`}
        style={{ color: "var(--text-secondary)" }}
      >
        <UsersIcon />
        <span className="text-[14px] font-semibold tabular-nums">
          {membersCount}
        </span>
      </div>
    </Link>
  );
}

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

function SeekingBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
      style={{
        background: "oklch(0.97 0.05 70)",
        color: "oklch(0.45 0.13 70)",
      }}
    >
      {children}
    </span>
  );
}

function UsersIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
