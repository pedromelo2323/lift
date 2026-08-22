import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchWorkoutDetailFromDb, fetchWorkoutsFromDb } from "@/lib/workouts/fetch";
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
      return {
        ...exercise,
        sessions: [
          ...exercise.sessions.filter((session) => session.session_date !== today),
          {
            id: `draft-${exercise.id}`,
            exercise_id: exercise.id,
            session_date: today,
            sets: draft.sets,
            created_at: new Date(draft.updatedAt).toISOString(),
          },
        ],
      };
    }),
  };
}

export const workoutsKey = ["workouts"] as const;
export const workoutKey = (id: string) => ["workout", id] as const;

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
