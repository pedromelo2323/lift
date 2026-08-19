import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchWorkoutDetailFromDb, fetchWorkoutsFromDb } from "@/lib/workouts/fetch";

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
  return workout;
}
