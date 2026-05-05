"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { PositionTag, RatingRing } from "@/components/ui";
import { positionCode, teamFallbackHue } from "@/lib/playerBadges";
import type { TeamLogo } from "./badges";

const AVATAR_SIZE = 54;
const TEAM_BADGE_SIZE = 22;

type Props = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  position?: string[] | null;
  city?: string | null;
  district?: string | null;
  skillLevel?: string | null;
  lookingForTeam?: boolean;
  rating?: number | null;
  teams?: TeamLogo[];
  onClick?: () => void;
  roleBadge?: string;
};

function PlayerListRowImpl({
  id,
  name,
  avatarUrl,
  position,
  lookingForTeam,
  rating,
  teams,
  onClick,
  roleBadge,
}: Props) {
  const sharedClass =
    "flex items-center gap-3.5 px-4 py-3 last:border-b-0 transition-colors active:bg-bg-secondary";
  const sharedStyle = { borderBottom: "1px solid var(--ink-100)" };

  const codes = (position ?? [])
    .map((p) => positionCode(p))
    .filter((c): c is NonNullable<ReturnType<typeof positionCode>> => c != null);
  const visibleTeams = (teams ?? []).slice(0, 3);

  const inner = (
    <>
      <div
        className="relative shrink-0"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, isolation: "isolate" }}
      >
        <PlayerAvatar src={avatarUrl} name={name} />
        {visibleTeams.length > 0 && <TeamStack teams={visibleTeams} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[16px] font-semibold truncate leading-[1.2]"
            style={{ color: "var(--ink-900)" }}
          >
            {name}
          </span>
          {lookingForTeam && <SeekingBadge />}
          {roleBadge && <RoleBadge label={roleBadge} />}
        </div>
        {codes.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {codes.map((c) => (
              <PositionTag key={c} code={c} />
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0">
        <RatingRing rating={rating} size={56} />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left ${sharedClass}`}
        style={sharedStyle}
      >
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

export const PlayerListRow = memo(PlayerListRowImpl);

function PlayerAvatar({ src, name }: { src?: string | null; name: string }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        background: src ? "var(--ink-100)" : "var(--ink-100)",
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
        <span className="text-[17px] font-bold" style={{ color: "var(--ink-500)" }}>
          {initials}
        </span>
      )}
    </div>
  );
}

function TeamStack({ teams }: { teams: TeamLogo[] }) {
  const OVERLAP = 8;
  return (
    <div
      className="absolute flex pointer-events-none"
      style={{ right: -4, bottom: -2 }}
    >
      {teams.map((t, i) => (
        <TeamBadge
          key={t.id}
          team={t}
          style={{
            marginLeft: i === 0 ? 0 : -OVERLAP,
            zIndex: teams.length - i,
          }}
        />
      ))}
    </div>
  );
}

function TeamBadge({ team, style }: { team: TeamLogo; style?: React.CSSProperties }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "?";
  const hue = teamFallbackHue(team.id);
  const fallbackBg = `oklch(0.45 0.10 ${hue})`;

  if (team.logo_url) {
    return (
      <span
        className="inline-block rounded-full overflow-hidden bg-white"
        style={{
          width: TEAM_BADGE_SIZE,
          height: TEAM_BADGE_SIZE,
          border: "2px solid var(--card)",
          ...style,
        }}
      >
        <Image
          src={team.logo_url}
          alt={team.name}
          width={TEAM_BADGE_SIZE}
          height={TEAM_BADGE_SIZE}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white"
      style={{
        width: TEAM_BADGE_SIZE,
        height: TEAM_BADGE_SIZE,
        background: fallbackBg,
        border: "2px solid var(--card)",
        fontSize: 9,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {initial}
    </span>
  );
}

function SeekingBadge() {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
      style={{ background: "var(--green-50)", color: "var(--green-800)" }}
    >
      Ищет команду
    </span>
  );
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0 uppercase"
      style={{
        background: "var(--ink-100)",
        color: "var(--ink-500)",
        letterSpacing: "0.4px",
      }}
    >
      {label}
    </span>
  );
}
