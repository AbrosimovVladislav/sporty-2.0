// Auto-generated types from Supabase will replace this file.
// Run: npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Database = {
  public: {
    Tables: {
      districts: {
        Row: {
          id: string;
          city: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          city: string;
          name: string;
          created_at?: string;
        };
        Update: {
          city?: string;
          name?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          telegram_id: number;
          name: string;
          city: string | null;
          sport: string | null;
          onboarding_completed: boolean;
          created_at: string;
          bio: string | null;
          birth_date: string | null;
          position: string | null;
          skill_level: string | null;
          preferred_time: string | null;
          looking_for_team: boolean;
          avatar_url: string | null;
          district_id: string | null;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          name: string;
          city?: string | null;
          sport?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          bio?: string | null;
          birth_date?: string | null;
          position?: string | null;
          skill_level?: string | null;
          preferred_time?: string | null;
          looking_for_team?: boolean;
          avatar_url?: string | null;
          district_id?: string | null;
        };
        Update: {
          name?: string;
          city?: string | null;
          sport?: string | null;
          onboarding_completed?: boolean;
          bio?: string | null;
          birth_date?: string | null;
          position?: string | null;
          skill_level?: string | null;
          preferred_time?: string | null;
          looking_for_team?: boolean;
          avatar_url?: string | null;
          district_id?: string | null;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          sport: string;
          city: string;
          description: string | null;
          looking_for_players: boolean;
          created_by: string;
          created_at: string;
          district_id: string | null;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          sport?: string;
          city: string;
          description?: string | null;
          looking_for_players?: boolean;
          created_by: string;
          created_at?: string;
          district_id?: string | null;
          logo_url?: string | null;
        };
        Update: {
          name?: string;
          sport?: string;
          city?: string;
          description?: string | null;
          looking_for_players?: boolean;
          district_id?: string | null;
          logo_url?: string | null;
        };
        Relationships: [];
      };
      team_memberships: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          role: "organizer" | "player";
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          role: "organizer" | "player";
          joined_at?: string;
        };
        Update: {
          role?: "organizer" | "player";
        };
        Relationships: [];
      };
      join_requests: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          status: "pending" | "accepted" | "rejected";
          direction: "player_to_team" | "team_to_player";
          invited_by: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          status?: "pending" | "accepted" | "rejected";
          direction?: "player_to_team" | "team_to_player";
          invited_by?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          status?: "pending" | "accepted" | "rejected";
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          created_by: string;
          created_at: string;
          district_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city: string;
          created_by: string;
          created_at?: string;
          district_id?: string | null;
        };
        Update: {
          name?: string;
          address?: string;
          city?: string;
          district_id?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          team_id: string;
          venue_id: string | null;
          type: "game" | "training" | "gathering" | "other";
          date: string;
          price_per_player: number;
          min_players: number;
          description: string | null;
          status: "planned" | "completed" | "cancelled";
          venue_cost: number;
          venue_paid: number;
          created_by: string;
          created_at: string;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          team_id: string;
          venue_id?: string | null;
          type: "game" | "training" | "gathering" | "other";
          date: string;
          price_per_player?: number;
          min_players?: number;
          description?: string | null;
          status?: "planned" | "completed" | "cancelled";
          venue_cost?: number;
          venue_paid?: number;
          created_by: string;
          created_at?: string;
          is_public?: boolean;
        };
        Update: {
          venue_id?: string | null;
          type?: "game" | "training" | "gathering" | "other";
          date?: string;
          price_per_player?: number;
          min_players?: number;
          description?: string | null;
          status?: "planned" | "completed" | "cancelled";
          venue_cost?: number;
          venue_paid?: number;
          is_public?: boolean;
        };
        Relationships: [];
      };
      event_attendances: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          vote: "yes" | "no" | null;
          attended: boolean | null;
          paid: boolean | null;
          paid_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          vote?: "yes" | "no" | null;
          attended?: boolean | null;
          paid?: boolean | null;
          paid_amount?: number | null;
          created_at?: string;
        };
        Update: {
          vote?: "yes" | "no" | null;
          attended?: boolean | null;
          paid?: boolean | null;
          paid_amount?: number | null;
        };
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          amount: number;
          type: "event_payment" | "deposit";
          event_id: string | null;
          note: string | null;
          confirmed_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id: string;
          amount: number;
          type: "event_payment" | "deposit";
          event_id?: string | null;
          note?: string | null;
          confirmed_by: string;
          created_at?: string;
        };
        Update: {
          amount?: number;
          note?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

export type District = Database["public"]["Tables"]["districts"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMembership = Database["public"]["Tables"]["team_memberships"]["Row"];
export type JoinRequest = Database["public"]["Tables"]["join_requests"]["Row"];
export type Venue = Database["public"]["Tables"]["venues"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventAttendance = Database["public"]["Tables"]["event_attendances"]["Row"];
export type FinancialTransaction = Database["public"]["Tables"]["financial_transactions"]["Row"];
