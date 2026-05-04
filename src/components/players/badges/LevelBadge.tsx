import { HexBadge } from "./HexBadge";
import { levelLetter, type LevelCode } from "@/lib/playerBadges";

type Props = {
  code: LevelCode | null;
  size?: "default" | "large";
};

const SIZE = {
  default: { w: 26, h: 30, fontMain: 14, fontDouble: 10 },
  large: { w: 38, h: 44, fontMain: 20, fontDouble: 14 },
};

export function LevelBadge({ code, size = "default" }: Props) {
  const s = SIZE[size];

  if (code == null) {
    return (
      <HexBadge
        width={s.w}
        height={s.h}
        borderColor="var(--lvl-empty-border)"
        fillFrom="var(--lvl-empty-fill-from)"
        fillMid="var(--lvl-empty-fill-mid)"
        fillTo="var(--lvl-empty-fill-to)"
      >
        <span
          className="font-display"
          style={{
            fontSize: s.fontMain,
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
  const fontSize = letter.length === 2 ? s.fontDouble : s.fontMain;

  return (
    <HexBadge
      width={s.w}
      height={s.h}
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
