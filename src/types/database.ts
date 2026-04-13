// Auto-generated types from Supabase will replace this file.
// Run: npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          name: string;
          first_name: string | null;
          last_name: string | null;
          photo_url: string | null;
          city: string | null;
          age_group: string | null;
          position: string | null;
          level: string | null;
          dominant_side: string | null;
          preferred_format: string | null;
          is_looking_for_team: boolean;
          available_for_one_off: boolean;
          available_for_substitutions: boolean;
          availability_days: string[];
          primary_team_id: string | null;
          bio: string | null;
          sport: string | null;
          onboarding_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          name: string;
          first_name?: string | null;
          last_name?: string | null;
          photo_url?: string | null;
          city?: string | null;
          age_group?: string | null;
          position?: string | null;
          level?: string | null;
          dominant_side?: string | null;
          preferred_format?: string | null;
          is_looking_for_team?: boolean;
          available_for_one_off?: boolean;
          available_for_substitutions?: boolean;
          availability_days?: string[];
          primary_team_id?: string | null;
          bio?: string | null;
          sport?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          first_name?: string | null;
          last_name?: string | null;
          photo_url?: string | null;
          city?: string | null;
          age_group?: string | null;
          position?: string | null;
          level?: string | null;
          dominant_side?: string | null;
          preferred_format?: string | null;
          is_looking_for_team?: boolean;
          available_for_one_off?: boolean;
          available_for_substitutions?: boolean;
          availability_days?: string[];
          primary_team_id?: string | null;
          bio?: string | null;
          sport?: string | null;
          onboarding_completed?: boolean;
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
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sport?: string;
          city: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          sport?: string;
          city?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      team_memberships: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          role: "organizer" | "player";
          team_role_label: string | null;
          left_at: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          role: "organizer" | "player";
          team_role_label?: string | null;
          left_at?: string | null;
          joined_at?: string;
        };
        Update: {
          role?: "organizer" | "player";
          team_role_label?: string | null;
          left_at?: string | null;
        };
        Relationships: [];
      };
      player_stats: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          matches_played: number;
          goals: number;
          assists: number;
          saves: number;
          clean_sheets: number;
          average_rating: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport?: string;
          matches_played?: number;
          goals?: number;
          assists?: number;
          saves?: number;
          clean_sheets?: number;
          average_rating?: number | null;
          updated_at?: string;
        };
        Update: {
          sport?: string;
          matches_played?: number;
          goals?: number;
          assists?: number;
          saves?: number;
          clean_sheets?: number;
          average_rating?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMembership = Database["public"]["Tables"]["team_memberships"]["Row"];
export type PlayerStats = Database["public"]["Tables"]["player_stats"]["Row"];
