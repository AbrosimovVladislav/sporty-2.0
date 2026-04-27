const STORAGE_KEY = "sporty:lastTeamId";

export function getLastActiveTeamId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastActiveTeamId(teamId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, teamId);
  } catch {
    // ignore
  }
}

export function clearLastActiveTeamId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
