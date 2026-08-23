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
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          name: string;
          sets_reps: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          name: string;
          sets_reps?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          name?: string;
          sets_reps?: string | null;
          sort_order?: number;
          created_at?: string;
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
        };
        Insert: {
          id?: string;
          exercise_id: string;
          session_date: string;
          sets?: Json;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          session_date?: string;
          sets?: Json;
          note?: string | null;
          created_at?: string;
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
        };
        Insert: {
          exercise_id: string;
          note?: string;
          updated_at?: string;
        };
        Update: {
          exercise_id?: string;
          note?: string;
          updated_at?: string;
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
        };
        Insert: {
          id?: string;
          body: string;
          kind?: string;
          resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          body?: string;
          kind?: string;
          resolved?: boolean;
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
