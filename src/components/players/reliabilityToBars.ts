/**
 * Maps a player's reliability % (attended / votedYes among completed events)
 * into 0..5 bars for the list mini-bar.
 *
 * Returns 0 (render as dash) if the player has not played any completed events.
 */
export function reliabilityToBars(
  reliability: number | null | undefined,
  played: number,
): number {
  if (played === 0 || reliability === null || reliability === undefined) return 0;
  if (reliability >= 100) return 5;
  if (reliability >= 80) return 4;
  if (reliability >= 60) return 3;
  if (reliability >= 40) return 2;
  return 1;
}
