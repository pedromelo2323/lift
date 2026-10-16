export type Workout = {
  id: string;
  name: string;
  position: number;
  last_completed_at: string | null;
};

export type Exercise = {
  id: string;
  workout_id: string;
  name: string;
  position: number;
  target_reps: string | null;
  note: string | null;
  linked_to_next: boolean;
};

export type Session = {
  id: string;
  workout_id: string;
  date: string;
  skipped: boolean;
};

export type ExerciseSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight: number | null;
  reps: number | null;
};

export type SessionNote = {
  id: string;
  session_id: string;
  exercise_id: string;
  body: string | null;
};

export type WorkoutDetail = {
  workout: Workout;
  exercises: Exercise[];
  sessions: Session[];
  sets: ExerciseSet[];
  notes: SessionNote[];
};

export type HistoryEntry = {
  date: string;
  skipped: boolean;
  values: { weight: number | null; reps: number | null }[];
  note: string | null;
};

/** Number of sets shown by default. History with more sets widens the table. */
export const DEFAULT_SET_COUNT = 3;

/** How many past sessions are shown above today's row. */
export const HISTORY_LENGTH = 3;
