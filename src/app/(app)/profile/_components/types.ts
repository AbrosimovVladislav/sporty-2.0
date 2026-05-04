export type Tab = "about" | "results" | "reliability" | "achievements";

export type Stats = {
  playedCount: number;
  votedYesCount: number;
  attendedCount: number;
  reliability: number | null;
  recentEvents: {
    event_id: string;
    type: string;
    date: string;
    vote: string | null;
    attended: boolean | null;
  }[];
};

export type ProfileTeam = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type JoinRequestItem = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  direction: "player_to_team" | "team_to_player";
  inviter_name: string | null;
  created_at: string;
  resolved_at: string | null;
  team: { id: string; name: string; city: string; sport: string };
};
