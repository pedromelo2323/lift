export type SetEntry = {
  weight: number | null;
  reps: number | null;
};

export type Workout = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type WorkoutWithMeta = Workout & {
  last_completed_date: string | null;
};

export type Exercise = {
  id: string;
  workout_id: string;
  name: string;
  sets_reps: string | null;
  sort_order: number;
  created_at: string;
  /** Superset with the next exercise by sort_order. */
  linked_to_next: boolean;
};

export type ExerciseSession = {
  id: string;
  exercise_id: string;
  session_date: string;
  sets: SetEntry[];
  note: string | null;
  created_at: string;
};

export type ExerciseNote = {
  exercise_id: string;
  note: string;
  updated_at: string;
};

export type ExerciseWithData = Exercise & {
  note: string | null;
  sessions: ExerciseSession[];
  all_time_best: SetEntry | null;
};

export type WorkoutDetail = Workout & {
  exercises: ExerciseWithData[];
};

export const DEFAULT_SETS: SetEntry[] = [
  { weight: null, reps: null },
  { weight: null, reps: null },
  { weight: null, reps: null },
];
