import type { LevelCode } from "@/lib/playerBadges";

type Props = {
  rating: number | null;
  level: LevelCode | null;
  size?: number;
};

export function RatingCircle({ rating, level, size = 48 }: Props) {
  const stroke = 3.5;
  const radius = (size - stroke - 3) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const fontSize = Math.round(size * 0.36);

  const palette = level ?? "empty";
  const ringColor = `var(--lvl-${palette}-ring)`;
  const ringBg = `var(--lvl-${palette}-ring-bg)`;
  const numberColor = `var(--lvl-${palette}-number)`;

  const value = rating != null ? Math.max(0, Math.min(100, rating)) : 0;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative shrink-0 inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={ringBg}
          strokeWidth={stroke}
          fill="none"
        />
        {rating != null && (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        )}
      </svg>
      <span
        className="absolute font-display tabular-nums"
        style={{
          fontSize,
          fontWeight: 700,
          color: numberColor,
          lineHeight: 1,
        }}
      >
        {rating != null ? rating : "—"}
      </span>
    </div>
  );
}
