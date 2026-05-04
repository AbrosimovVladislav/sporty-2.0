"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import {
  LevelBadge,
  PositionBadge,
  RatingCircle,
  TeamLogosStack,
  type TeamLogo,
} from "./badges";
import { levelFromRating, positionCode } from "@/lib/playerBadges";

const AVATAR_SIZE = 52;

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
    "flex items-center gap-3.5 py-3 last:border-b-0 transition-colors active:bg-bg-secondary";
  const sharedStyle = { borderBottom: "1px solid var(--gray-100)" };

  const positionCodes = (position ?? [])
    .map((p) => positionCode(p))
    .filter((c): c is NonNullable<typeof c> => c != null)
    .slice(0, 2);

  const level = levelFromRating(rating ?? null);

  const inner = (
    <>
      <div className="relative shrink-0">
        <PlayerAvatar src={avatarUrl} name={name} />
        {teams && teams.length > 0 && <TeamLogosStack teams={teams} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[16px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </span>
          {lookingForTeam && <SeekingBadge />}
          {roleBadge && <RoleBadge label={roleBadge} />}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
          <LevelBadge code={level} />
          {positionCodes.map((c, i) => (
            <PositionBadge key={`${c}-${i}`} code={c} />
          ))}
        </div>
      </div>
      <div className="shrink-0">
        <RatingCircle rating={rating ?? null} level={level} size={48} />
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
      className="rounded-full overflow-hidden flex items-center justify-center bg-bg-card"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        border: "2px solid white",
        boxShadow: "0 0 0 1px var(--gray-200)",
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
          className="text-[17px] font-bold"
          style={{ color: "var(--text-secondary)" }}
        >
          {initials}
        </span>
      )}
    </div>
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
      style={{
        background: "var(--gray-100)",
        color: "var(--text-secondary)",
        letterSpacing: "0.4px",
      }}
    >
      {label}
    </span>
  );
}
