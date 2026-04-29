"use client";

import Link from "next/link";
import { Avatar, MiniBar } from "@/components/ui";
import { PositionChipList } from "@/components/PositionChip";
import { SKILL_LEVELS } from "@/lib/catalogs";
import { reliabilityToBars } from "./reliabilityToBars";

type Props = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  position?: string[] | null;
  city?: string | null;
  district?: string | null;
  skillLevel?: string | null;
  lookingForTeam?: boolean;
  reliability?: number | null;
  played?: number;
  onClick?: () => void;
  roleBadge?: string;
};

export function PlayerListRow({
  id,
  name,
  avatarUrl,
  position,
  city,
  district,
  skillLevel,
  lookingForTeam,
  reliability,
  played = 0,
  onClick,
  roleBadge,
}: Props) {
  const subtitle = !skillLevel ? district || city || null : null;
  const bars = reliabilityToBars(reliability ?? null, played);

  const sharedClass =
    "flex items-center gap-3.5 py-3 last:border-b-0 transition-colors active:bg-bg-secondary";
  const sharedStyle = { borderBottom: "1px solid var(--gray-100)" };

  const inner = (
    <>
      <Avatar src={avatarUrl} name={name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[15px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </span>
          {lookingForTeam && <SeekingBadge />}
          {roleBadge && <RoleBadge label={roleBadge} />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          <PositionChipList positions={position} tone="light" />
          {skillLevel && <SkillChip level={skillLevel} />}
          {subtitle && (
            <span
              className="text-[13px] truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <div
        className="shrink-0"
        aria-label={
          bars === 0
            ? "Надёжность: нет данных"
            : `Надёжность ${reliability ?? 0}%`
        }
      >
        {bars === 0 ? (
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--text-tertiary)" }}
          >
            —
          </span>
        ) : (
          <MiniBar value={bars} max={5} />
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left ${sharedClass}`} style={sharedStyle}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/players/${id}`} className={sharedClass} style={sharedStyle}>
      {inner}
    </Link>
  );
}

function SeekingBadge() {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
      style={{ background: "var(--green-50)", color: "var(--green-700)" }}
    >
      Ищет команду
    </span>
  );
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0 uppercase"
      style={{ background: "var(--gray-100)", color: "var(--text-secondary)", letterSpacing: "0.4px" }}
    >
      {label}
    </span>
  );
}

const SKILL_PALETTE: Record<number, { bg: string; fg: string }> = {
  1: { bg: "#F1F4F8", fg: "#6B7280" },
  2: { bg: "#E8F0FE", fg: "#1F66D9" },
  3: { bg: "#E6F7EC", fg: "#1F8A4C" },
  4: { bg: "#FFF4E0", fg: "#B86E00" },
  5: { bg: "#FFE3E3", fg: "#C12A2A" },
};

function SkillChip({ level }: { level: string }) {
  const idx = SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
  const num = idx >= 0 ? idx + 1 : 1;
  const c = SKILL_PALETTE[num] ?? SKILL_PALETTE[1];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-1.5 py-1 shrink-0 leading-none tracking-wider"
      style={{ background: c.bg, color: c.fg }}
    >
      <StarIcon />
      {level.toUpperCase()} · {num}/5
    </span>
  );
}

function StarIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
