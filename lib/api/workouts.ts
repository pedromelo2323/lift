import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchExerciseHistoryFromDb,
  fetchWorkoutDetailFromDb,
  fetchWorkoutsFromDb,
} from "@/lib/workouts/fetch";
import { readSessionDraft } from "@/lib/workouts/session-draft";
import { getTodayDateString } from "@/lib/utils/date";
import type { WorkoutDetail } from "@/types";

function applyLocalSessionDrafts(workout: WorkoutDetail): WorkoutDetail {
  const today = getTodayDateString();
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      const draft = readSessionDraft(exercise.id, today);
      if (!draft) return exercise;
      const existingToday = exercise.sessions.find((session) => session.session_date === today);
      return {
        ...exercise,
        sessions: [
          ...exercise.sessions.filter((session) => session.session_date !== today),
          {
            id: existingToday?.id ?? `draft-${exercise.id}`,
            exercise_id: exercise.id,
            session_date: today,
            sets: draft.sets,
            note: existingToday?.note ?? exercise.note,
            created_at: existingToday?.created_at ?? new Date(draft.updatedAt).toISOString(),
          },
        ],
      };
    }),
  };
}

export const workoutsKey = ["workouts"] as const;
export const workoutKey = (id: string) => ["workout", id] as const;
export const exerciseHistoryKey = (id: string) => ["exercise-history", id] as const;

export async function fetchWorkouts() {
  if (!isSupabaseConfigured()) return [];
  return fetchWorkoutsFromDb(createClient());
}

export async function fetchWorkoutDetail(id: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const workout = await fetchWorkoutDetailFromDb(createClient(), id);
  if (!workout) throw new Error("Workout not found");
  return applyLocalSessionDrafts(workout);
}

export async function fetchExerciseHistory(id: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const history = await fetchExerciseHistoryFromDb(createClient(), id);
  if (!history) throw new Error("Exercise not found");
  return history;
}
