export function getSportLabel(sport: string | null | undefined) {
  if (!sport) return "";

  const normalized = sport.trim().toLowerCase();
  if (normalized === "football") return "Футбол";

  return sport;
}
