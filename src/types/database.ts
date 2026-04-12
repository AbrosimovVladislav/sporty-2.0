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
          city: string | null;
          sport: string | null;
          onboarding_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          name: string;
          city?: string | null;
          sport?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          city?: string | null;
          sport?: string | null;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
