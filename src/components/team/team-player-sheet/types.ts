export type TeamPlayerSheetMember = {
  id: string;
  role: "organizer" | "player";
  user: {
    id: string;
    name: string;
    city: string | null;
    position: string[] | null;
    skill_level: string | null;
    avatar_url: string | null;
    rating: number | null;
  };
};

export type ReliabilityData = {
  totals: {
    played: number;
    votedYes: number;
    noShow: number;
    cancelled: number;
    reliability: number | null;
  };
  recentEvents: {
    event_id: string;
    type: string;
    date: string;
    vote: "yes" | "no" | null;
    attended: boolean | null;
  }[];
};

export type FinancesData = {
  totals: { expected: number; paid: number; balance: number };
  history: {
    id: string;
    amount: number;
    type: string;
    label: string;
    note: string | null;
    created_at: string;
    event_id: string | null;
  }[];
};

export type PeekContent = {
  primary: string;
  primaryColor?: string;
  secondary?: string;
};
