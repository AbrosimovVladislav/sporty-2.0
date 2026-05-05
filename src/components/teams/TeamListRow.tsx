"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { SPORT_LABEL } from "@/lib/catalogs";

const AVATAR_SIZE = 54;

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

function TeamListRowImpl({
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
      className="flex items-center gap-3.5 px-4 py-3 last:border-b-0 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--ink-100)" }}
    >
      <TeamAvatar src={logoUrl} name={name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[16px] font-semibold truncate leading-[1.2]"
            style={{ color: "var(--ink-900)" }}
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
            style={{ color: "var(--ink-500)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="shrink-0 flex items-center gap-1.5"
        aria-label={`${membersCount} участников`}
        style={{ color: "var(--ink-500)" }}
      >
        <UsersIcon />
        <span className="text-[14px] font-semibold tabular-nums">
          {membersCount}
        </span>
      </div>
    </Link>
  );
}

export const TeamListRow = memo(TeamListRowImpl);

function TeamAvatar({ src, name }: { src?: string | null; name: string }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        background: "var(--ink-100)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="text-[16px] font-bold"
          style={{ color: "var(--ink-900)", letterSpacing: "0.01em" }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
      style={{ background: "var(--green-50)", color: "var(--green-800)" }}
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
        background: "var(--warning-soft)",
        color: "var(--warning)",
      }}
    >
      {children}
    </span>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
