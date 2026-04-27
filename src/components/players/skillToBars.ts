import { SKILL_LEVELS } from "@/lib/catalogs";

export function skillToBars(skillLevel: string | null | undefined): number {
  if (!skillLevel) return 0;
  const idx = (SKILL_LEVELS as readonly string[]).indexOf(skillLevel);
  return idx >= 0 ? idx + 1 : 0;
}
