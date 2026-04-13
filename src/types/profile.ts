import type { User } from "@/types/database";

export const availabilityDayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type AvailabilityDay = (typeof availabilityDayOrder)[number];

export type ProfileTeamSummary = {
  id: string;
  name: string;
  city: string;
  sport: string;
  description: string | null;
  role: "organizer" | "player";
  teamRoleLabel: string | null;
  joinedAt: string;
  leftAt: string | null;
};

export type PlayerStatsSummary = {
  sport: string | null;
  matchesPlayed: number;
  goals: number;
  assists: number;
  saves: number;
  cleanSheets: number;
  averageRating: number | null;
};

export type PlayerProfilePayload = {
  user: User;
  stats: PlayerStatsSummary;
  primaryTeam: ProfileTeamSummary | null;
  currentTeams: ProfileTeamSummary[];
  pastTeams: ProfileTeamSummary[];
};

export type PlayerProfileUpdateInput = {
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  level: string;
  dominantSide: string;
  preferredFormat: string;
  isLookingForTeam: boolean;
  availableForOneOff: boolean;
  availableForSubstitutions: boolean;
  availabilityDays: AvailabilityDay[];
  city: string;
  ageGroup: string;
  bio: string;
  photoUrl: string;
  primaryTeamId: string | null;
  teamRoleLabel: string;
};
