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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          language: string;
          daily_goal: number;
          theme: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          language?: string;
          daily_goal?: number;
          theme?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          language?: string;
          daily_goal?: number;
          theme?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      words: {
        Row: {
          id: string;
          language: string;
          word: string;
          part_of_speech: string;
          definition: string;
          example_sentence: string;
          level: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          language?: string;
          word: string;
          part_of_speech: string;
          definition: string;
          example_sentence: string;
          level?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          language?: string;
          word?: string;
          part_of_speech?: string;
          definition?: string;
          example_sentence?: string;
          level?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_words: {
        Row: {
          user_id: string;
          word_id: string;
          language: string;
          ease: number;
          interval_days: number;
          next_review_at: string;
          streak_correct: number;
          times_seen: number;
          times_correct: number;
          last_seen_at: string | null;
        };
        Insert: {
          user_id: string;
          word_id: string;
          language?: string;
          ease?: number;
          interval_days?: number;
          next_review_at?: string;
          streak_correct?: number;
          times_seen?: number;
          times_correct?: number;
          last_seen_at?: string | null;
        };
        Update: {
          user_id?: string;
          word_id?: string;
          language?: string;
          ease?: number;
          interval_days?: number;
          next_review_at?: string;
          streak_correct?: number;
          times_seen?: number;
          times_correct?: number;
          last_seen_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_words_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          language: string;
          mode: string;
          correct: boolean;
          typed_text: string;
          time_ms: number;
          accuracy: number;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          language?: string;
          mode: string;
          correct: boolean;
          typed_text: string;
          time_ms: number;
          accuracy: number;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word_id?: string;
          language?: string;
          mode?: string;
          correct?: boolean;
          typed_text?: string;
          time_ms?: number;
          accuracy?: number;
          points_earned?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_stats: {
        Row: {
          user_id: string;
          date: string;
          language: string;
          points: number;
          words_practiced: number;
          goal_met: boolean;
        };
        Insert: {
          user_id: string;
          date?: string;
          language?: string;
          points?: number;
          words_practiced?: number;
          goal_met?: boolean;
        };
        Update: {
          user_id?: string;
          date?: string;
          language?: string;
          points?: number;
          words_practiced?: number;
          goal_met?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
