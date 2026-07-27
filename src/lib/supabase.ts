import { createClient } from "@supabase/supabase-js";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Database = {
  public: {
    Tables: {
      dorm_states: {
        Row: {
          id: string;
          dorm_code: string;
          state_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          dorm_code: string;
          state_json: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dorm_code?: string;
          state_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          dorm_code: string;
          role: "member" | "leader";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          password_hash: string;
          dorm_code: string;
          role?: "member" | "leader";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          dorm_code?: string;
          role?: "member" | "leader";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  supabaseClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}
