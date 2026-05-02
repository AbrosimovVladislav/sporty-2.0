import { Avatar } from "@/components/ui";
import { PositionChipList } from "@/components/PositionChip";
import { SkillBadge } from "./atoms";
import { PinIcon } from "./icons";
import { ratingColor } from "@/lib/ratingColor";
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
  const positions = member.user.position ?? [];

  return (
    <>
      <div className="flex items-start gap-3">
        <Avatar src={member.user.avatar_url} name={member.user.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-[18px] font-bold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {member.user.name}
            </p>
            {member.user.rating != null && (
              <span
                className="text-[18px] font-black tabular-nums leading-tight"
                style={{ color: ratingColor(member.user.rating) }}
              >
                {member.user.rating}
              </span>
            )}
            {isTargetOrganizer && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  background: "var(--green-50)",
                  color: "var(--green-700)",
                  letterSpacing: "0.6px",
                }}
              >
                Организатор
              </span>
            )}
          </div>

          {(positions.length > 0 || member.user.city) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <PositionChipList positions={positions} tone="light" />
              {member.user.city && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <PinIcon />
                  {member.user.city}
                </span>
              )}
            </div>
          )}

          {member.user.skill_level && (
            <div className="mt-2">
              <SkillBadge level={member.user.skill_level} num={skillNum} />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onOpenProfile}
        className="w-full h-11 rounded-xl text-[14px] font-semibold"
        style={{ background: "var(--gray-100)", color: "var(--text-primary)" }}
      >
        Открыть профиль
      </button>
    </>
  );
}
