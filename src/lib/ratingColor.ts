export function ratingColor(rating: number): string {
  if (rating >= 80) return "#f59e0b";
  if (rating >= 60) return "#22c55e";
  if (rating >= 40) return "#60a5fa";
  if (rating >= 20) return "#f97316";
  return "#ef4444";
}
