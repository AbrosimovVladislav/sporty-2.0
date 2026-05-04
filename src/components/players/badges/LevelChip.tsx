import { LevelBadge } from "./LevelBadge";
import { SKILL_LEVELS } from "@/lib/catalogs";
import type { LevelCode } from "@/lib/playerBadges";

type Props = {
  code: LevelCode;
  skillLabel: string | null;
  skillNum: number;
};

export function LevelChip({ code, skillLabel, skillNum }: Props) {
  const showSkill = !!skillLabel && skillNum > 0;
  return (
    <div className="inline-flex items-center shrink-0">
      <LevelBadge code={code} />
      {showSkill && (
        <span
          className="inline-flex items-center"
          style={{
            height: 22,
            padding: "0 10px 0 8px",
            marginLeft: -1,
            background: "var(--bg-primary)",
            border: "1.5px solid var(--gray-200)",
            borderRadius: "0 9999px 9999px 0",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
          }}
        >
          {skillLabel}
          <span
            style={{
              color: "var(--text-tertiary)",
              marginLeft: 6,
              fontWeight: 600,
            }}
          >
            {skillNum}/{SKILL_LEVELS.length}
          </span>
        </span>
      )}
    </div>
  );
}
