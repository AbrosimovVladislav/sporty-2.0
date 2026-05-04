import Image from "next/image";
import { HexBadge } from "./HexBadge";
import { positionShortLabel, type PositionCode } from "@/lib/playerBadges";

type Props = {
  code: PositionCode;
};

const ICON: Record<PositionCode, string> = {
  vrt: "/badges/glove.png",
  zash: "/badges/shield.png",
  pzsh: "/badges/target.png",
  nap: "/badges/boot.png",
};

export function PositionBadge({ code }: Props) {
  const label = positionShortLabel(code);
  return (
    <div className="inline-flex items-center shrink-0">
      <HexBadge
        borderColor={`var(--pos-${code}-border)`}
        fillFrom={`var(--pos-${code}-fill-from)`}
        fillTo={`var(--pos-${code}-fill-to)`}
      >
        <Image
          src={ICON[code]}
          alt=""
          width={15}
          height={15}
          className="select-none pointer-events-none"
        />
      </HexBadge>
      <span
        className="inline-flex items-center justify-center"
        style={{
          height: 18,
          padding: "0 8px 0 6px",
          marginLeft: -1,
          background: `var(--pos-${code}-pill-bg)`,
          color: `var(--pos-${code}-pill-fg)`,
          border: `1.5px solid var(--pos-${code}-pill-border)`,
          borderRadius: "0 9999px 9999px 0",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.04em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
