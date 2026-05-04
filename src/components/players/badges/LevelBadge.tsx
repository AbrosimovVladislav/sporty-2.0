import { HexBadge } from "./HexBadge";
import { levelLetter, type LevelCode } from "@/lib/playerBadges";

type Props = {
  code: LevelCode | null;
};

export function LevelBadge({ code }: Props) {
  if (code == null) {
    return (
      <HexBadge
        borderColor="var(--lvl-empty-border)"
        fillFrom="var(--lvl-empty-fill-from)"
        fillMid="var(--lvl-empty-fill-mid)"
        fillTo="var(--lvl-empty-fill-to)"
      >
        <span
          className="font-display"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-tertiary)",
            lineHeight: 1,
          }}
        >
          —
        </span>
      </HexBadge>
    );
  }

  const letter = levelLetter(code);
  const fontSize = letter.length === 2 ? 10 : 14;

  return (
    <HexBadge
      borderColor={`var(--lvl-${code}-border)`}
      fillFrom={`var(--lvl-${code}-fill-from)`}
      fillMid={`var(--lvl-${code}-fill-mid)`}
      fillTo={`var(--lvl-${code}-fill-to)`}
    >
      <span
        className="font-display"
        style={{
          fontSize,
          fontWeight: 700,
          color: "white",
          lineHeight: 1,
          textShadow: "0 1px 1px rgba(0,0,0,0.25)",
        }}
      >
        {letter}
      </span>
    </HexBadge>
  );
}
