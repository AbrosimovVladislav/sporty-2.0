import Image from "next/image";
import { LevelChip } from "@/components/players/badges/LevelChip";
import { PositionBadge } from "@/components/players/badges/PositionBadge";
import {
  levelFromRating,
  positionCode,
  type PositionCode,
} from "@/lib/playerBadges";
import { CrownIcon, PinIcon } from "./icons";
import type { TeamPlayerSheetMember } from "./types";

export function SheetHeader({
  member,
  isTargetOrganizer,
  skillNum,
  onOpenProfile,
}: {
  member: TeamPlayerSheetMember;
  isTargetOrganizer: boolean;
  skillNum: number;
  onOpenProfile: () => void;
}) {
  const levelCode = levelFromRating(member.user.rating);
  const positions = (member.user.position ?? [])
    .map((p) => positionCode(p))
    .filter((c): c is PositionCode => c !== null);

  const hasBadgesRow = !!levelCode || positions.length > 0;

  return (
    <>
      <div className="flex items-start gap-4">
        <AvatarWithRating
          src={member.user.avatar_url}
          name={member.user.name}
          rating={member.user.rating}
        />
        <div className="flex-1 min-w-0 pt-1 flex flex-col gap-2.5">
          <h2
            className="font-display font-bold uppercase wrap-break-word"
            style={{
              fontSize: 24,
              lineHeight: 1.1,
              letterSpacing: "0.01em",
              color: "var(--text-primary)",
            }}
          >
            {member.user.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {isTargetOrganizer && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase"
                style={{
                  border: "1.5px solid var(--green-500)",
                  color: "var(--green-700)",
                  letterSpacing: "0.06em",
                }}
              >
                <CrownIcon />
                Организатор
              </span>
            )}
            {member.user.city && (
              <span
                className="inline-flex items-center gap-1 text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                <PinIcon />
                {member.user.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasBadgesRow && (
        <div className="flex flex-wrap gap-2 items-center">
          {levelCode && (
            <LevelChip
              code={levelCode}
              skillLabel={member.user.skill_level}
              skillNum={skillNum}
            />
          )}
          {positions.map((c) => (
            <PositionBadge key={c} code={c} />
          ))}
        </div>
      )}

      <button
        onClick={onOpenProfile}
        className="w-full h-12 rounded-full text-[15px] font-semibold"
        style={{
          background: "var(--text-primary)",
          color: "white",
        }}
      >
        Открыть профиль
      </button>
    </>
  );
}

function AvatarWithRating({
  src,
  name,
  rating,
}: {
  src: string | null;
  name: string;
  rating: number | null;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: src ? "white" : "var(--gray-100)",
          border: "1px solid var(--gray-200)",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={84}
            height={84}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-display text-[28px] font-bold"
            style={{ color: "var(--text-secondary)" }}
          >
            {initial}
          </span>
        )}
      </div>
      {rating != null && (
        <div
          className="absolute flex items-center justify-center font-display tabular-nums"
          style={{
            right: -2,
            bottom: -2,
            width: 30,
            height: 30,
            borderRadius: "9999px",
            background: "var(--text-primary)",
            color: "white",
            border: "2.5px solid white",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {rating}
        </div>
      )}
    </div>
  );
}

