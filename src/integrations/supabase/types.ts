export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      bonus_predictions: {
        Row: {
          champion_team_id: string | null
          created_at: string
          top_scorer_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          champion_team_id?: string | null
          created_at?: string
          top_scorer_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          champion_team_id?: string | null
          created_at?: string
          top_scorer_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          max_uses: number | null
          note: string | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          max_uses?: number | null
          note?: string | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          max_uses?: number | null
          note?: string | null
          uses_count?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          auto_score_sync_3h_at: string | null
          auto_score_sync_4h_at: string | null
          away_score: number | null
          away_team_id: string | null
          away_team_label: string | null
          created_at: string
          external_id: string | null
          group_letter: string | null
          home_score: number | null
          home_team_id: string | null
          home_team_label: string | null
          id: string
          kickoff_at: string
          score_locked: boolean
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          auto_score_sync_3h_at?: string | null
          auto_score_sync_4h_at?: string | null
          away_score?: number | null
          away_team_id?: string | null
          away_team_label?: string | null
          created_at?: string
          external_id?: string | null
          group_letter?: string | null
          home_score?: number | null
          home_team_id?: string | null
          home_team_label?: string | null
          id?: string
          kickoff_at: string
          score_locked?: boolean
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          auto_score_sync_3h_at?: string | null
          auto_score_sync_4h_at?: string | null
          away_score?: number | null
          away_team_id?: string | null
          away_team_label?: string | null
          created_at?: string
          external_id?: string | null
          group_letter?: string | null
          home_score?: number | null
          home_team_id?: string | null
          home_team_label?: string | null
          id?: string
          kickoff_at?: string
          score_locked?: boolean
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          name: string
          nationality: string | null
          position: string | null
          shirt_number: number | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          nationality?: string | null
          position?: string | null
          shirt_number?: number | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          nationality?: string | null
          position?: string | null
          shirt_number?: number | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          points: number
          score1_away: number
          score1_home: number
          score2_away: number
          score2_home: number
          score3_away: number
          score3_home: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          points?: number
          score1_away: number
          score1_home: number
          score2_away: number
          score2_home: number
          score3_away: number
          score3_home: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          points?: number
          score1_away?: number
          score1_home?: number
          score2_away?: number
          score2_home?: number
          score3_away?: number
          score3_home?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          disqualified: boolean
          disqualified_at: string | null
          disqualified_reason: string | null
          display_name: string
          email: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          disqualified?: boolean
          disqualified_at?: string | null
          disqualified_reason?: string | null
          display_name: string
          email: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          disqualified?: boolean
          disqualified_at?: string | null
          disqualified_reason?: string | null
          display_name?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          code: string | null
          created_at: string
          external_id: string | null
          flag_emoji: string | null
          group_letter: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          external_id?: string | null
          flag_emoji?: string | null
          group_letter?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          external_id?: string | null
          flag_emoji?: string | null
          group_letter?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tournament_settings: {
        Row: {
          bonus_lock_at: string | null
          champion_points: number
          champion_team_id: string | null
          id: number
          top_scorer_name: string | null
          top_scorer_points: number
          updated_at: string
        }
        Insert: {
          bonus_lock_at?: string | null
          champion_points?: number
          champion_team_id?: string | null
          id?: number
          top_scorer_name?: string | null
          top_scorer_points?: number
          updated_at?: string
        }
        Update: {
          bonus_lock_at?: string | null
          champion_points?: number
          champion_team_id?: string | null
          id?: number
          top_scorer_name?: string | null
          top_scorer_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_settings_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          champion_points: number | null
          display_name: string | null
          guessed_scores: number | null
          match_points: number | null
          matches_predicted: number | null
          predicted_scores: number | null
          predictions_count: number | null
          top_scorer_points: number | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      validate_invite_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      match_stage:
        | "group"
        | "r32"
        | "r16"
        | "qf"
        | "sf"
        | "third_place"
        | "final"
      match_status: "scheduled" | "live" | "finished" | "postponed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      match_stage: ["group", "r32", "r16", "qf", "sf", "third_place", "final"],
      match_status: ["scheduled", "live", "finished", "postponed"],
    },
  },
} as const
