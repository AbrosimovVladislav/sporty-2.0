import Image from "next/image";
import { teamFallbackHue } from "@/lib/playerBadges";

export type TeamLogo = {
  id: string;
  name: string;
  logo_url?: string | null;
};

type Props = {
  teams: TeamLogo[];
  max?: number;
};

const SIZE = 24;
const OVERLAP = 9;

export function TeamLogosStack({ teams, max = 3 }: Props) {
  if (teams.length === 0) return null;

  const visible = teams.slice(0, max);

  return (
    <div
      className="absolute flex pointer-events-none"
      style={{ left: 32, bottom: -2 }}
    >
      {visible.map((t, i) => (
        <TeamLogo
          key={t.id}
          team={t}
          style={{
            marginLeft: i === 0 ? 0 : -OVERLAP,
            zIndex: i + 1,
          }}
        />
      ))}
    </div>
  );
}

function TeamLogo({
  team,
  style,
}: {
  team: TeamLogo;
  style?: React.CSSProperties;
}) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "?";

  if (team.logo_url) {
    return (
      <span
        className="relative inline-block rounded-full overflow-hidden bg-white"
        style={{
          width: SIZE,
          height: SIZE,
          border: "2.5px solid white",
          ...style,
        }}
      >
        <Image
          src={team.logo_url}
          alt={team.name}
          width={SIZE}
          height={SIZE}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  const hue = teamFallbackHue(team.id);
  const bg = `oklch(0.62 0.14 ${hue})`;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white"
      style={{
        width: SIZE,
        height: SIZE,
        background: bg,
        border: "2.5px solid white",
        fontSize: 9,
        fontWeight: 800,
        lineHeight: 1,
        ...style,
      }}
    >
      {initial}
    </span>
  );
}
