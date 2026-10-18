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
      workouts: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          name: string;
          sets_reps: string | null;
          linked_to_next: boolean;
          sort_order: number;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          name: string;
          sets_reps?: string | null;
          linked_to_next?: boolean;
          sort_order?: number;
          created_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          name?: string;
          sets_reps?: string | null;
          linked_to_next?: boolean;
          sort_order?: number;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_sessions: {
        Row: {
          id: string;
          exercise_id: string;
          session_date: string;
          sets: Json;
          note: string | null;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          session_date: string;
          sets?: Json;
          note?: string | null;
          created_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          session_date?: string;
          sets?: Json;
          note?: string | null;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_sessions_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_notes: {
        Row: {
          exercise_id: string;
          note: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          exercise_id: string;
          note?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          exercise_id?: string;
          note?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_notes_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: true;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      bug_reports: {
        Row: {
          id: string;
          body: string;
          kind: string;
          resolved: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          body: string;
          kind?: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          body?: string;
          kind?: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          age_range: string | null;
          sex: string | null;
          goal: string | null;
          days_per_week: number | null;
          session_minutes: number | null;
          experience: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          age_range?: string | null;
          sex?: string | null;
          goal?: string | null;
          days_per_week?: number | null;
          session_minutes?: number | null;
          experience?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          age_range?: string | null;
          sex?: string | null;
          goal?: string | null;
          days_per_week?: number | null;
          session_minutes?: number | null;
          experience?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_usage: {
        Row: {
          user_id: string;
          plan_generations: number;
          voice_day: string | null;
          voice_count: number;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      claim_plan_generation: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      claim_voice_transcription: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_plan: {
        Args: { plan: Json };
        Returns: undefined;
      };
      delete_my_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
