/**
 * RatingRing — Design System v2.
 * SVG-кольцо с градиентом и tier-зависимым цветом числа.
 * Используется в списках игроков, карточке игрока, профиле.
 */

import { useId } from "react";
import { ratingTier, ratingTierColors } from "@/lib/ratingTier";

type Props = {
  rating: number | null | undefined;
  size?: number;
};

export function RatingRing({ rating, size = 56 }: Props) {
  const reactId = useId();
  const stroke = Math.max(3, Math.round(size * 0.063));
  const r = (size - stroke - 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  const tier = ratingTier(rating);
  const colors = ratingTierColors(tier);
  const value = rating == null ? 0 : Math.max(0, Math.min(100, rating));
  const dash = (c * value) / 100;

  const fontSize = Math.round(size * 0.43);
  const gradId = `rating-grad-${reactId.replace(/:/g, "")}`;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.c1} />
            <stop offset="100%" stopColor={colors.c2} />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.track}
          strokeWidth={stroke}
        />
        {rating != null && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
      </svg>
      <span
        className="font-display tabular-nums"
        style={{
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          color: colors.text,
          position: "relative",
          zIndex: 1,
        }}
      >
        {rating != null ? rating : "—"}
      </span>
    </div>
  );
}
