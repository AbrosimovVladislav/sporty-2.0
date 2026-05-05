export type Tab = "about" | "results" | "finances" | "achievements";

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

export type FinancesPayload = {
  teams: {
    team_id: string;
    team_name: string;
    team_logo_url: string | null;
    role: "organizer" | "player";
    expected: number;
    paid: number;
    balance: number;
  }[];
  totals: { expected: number; paid: number; balance: number };
  history: {
    id: string;
    team_id: string;
    team_name: string | null;
    amount: number;
    type: "event_payment" | "deposit";
    label: string;
    note: string | null;
    created_at: string;
    event_id: string | null;
  }[];
};
