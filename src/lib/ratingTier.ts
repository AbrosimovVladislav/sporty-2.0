/**
 * Rating tier system (Design System v2).
 * Score → tier with gradient ring + tier-specific text/track colors.
 */

export type RatingTier = "elite" | "high" | "mid" | "low" | "poor";

export type RatingTierColors = {
  c1: string;     // gradient start
  c2: string;     // gradient end
  text: string;   // number color
  track: string;  // ring background
};

export function ratingTier(rating: number | null | undefined): RatingTier | null {
  if (rating == null) return null;
  if (rating >= 90) return "elite";
  if (rating >= 80) return "high";
  if (rating >= 70) return "mid";
  if (rating >= 55) return "low";
  return "poor";
}

export function ratingTierColors(tier: RatingTier | null): RatingTierColors {
  if (tier === null) {
    return {
      c1: "var(--ink-300)",
      c2: "var(--ink-400)",
      text: "var(--ink-400)",
      track: "var(--ink-100)",
    };
  }
  return {
    c1: `var(--rating-${tier}-c1)`,
    c2: `var(--rating-${tier}-c2)`,
    text: `var(--rating-${tier}-text)`,
    track: `var(--rating-${tier}-track)`,
  };
}
