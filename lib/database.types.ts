import type { GameState } from './types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          scenario_id: string | null;
          scenario_title: string | null;
          player_actor_name: string | null;
          game_state: Json;
          current_turn: number;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          scenario_id?: string | null;
          scenario_title?: string | null;
          player_actor_name?: string | null;
          game_state: Json;
          current_turn?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          scenario_id?: string | null;
          scenario_title?: string | null;
          player_actor_name?: string | null;
          game_state?: Json;
          current_turn?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shared_sessions: {
        Row: {
          id: string;
          session_id: string;
          share_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          share_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          share_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_sessions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_shared_session: {
        Args: { token: string };
        Returns: {
          session_id: string;
          title: string;
          scenario_title: string | null;
          player_actor_name: string | null;
          game_state: Json;
          current_turn: number;
          is_completed: boolean;
          created_at: string;
        }[];
      };
      get_analytics_stats: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          total_sessions: number;
          completed_sessions: number;
          avg_session_duration_seconds: number;
          avg_turns_per_game: number;
          completion_rate: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type GameSessionRow = Database['public']['Tables']['game_sessions']['Row'];
export type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert'];
export type GameSessionUpdate = Database['public']['Tables']['game_sessions']['Update'];

// Typed version with GameState instead of Json
export interface GameSession extends Omit<GameSessionRow, 'game_state'> {
  game_state: GameState;
}

export type SharedSessionRow = Database['public']['Tables']['shared_sessions']['Row'];
export type SharedSessionInsert = Database['public']['Tables']['shared_sessions']['Insert'];

export interface SharedSession extends SharedSessionRow {}

// Analytics types
export type AnalyticsStats = Database['public']['Functions']['get_analytics_stats']['Returns'][number];
