import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_WORKOUTS } from "@/lib/seed/workouts";
import type { WorkoutDetail, WorkoutWithMeta } from "@/types";
import { fetchWorkoutDetailFromDb, fetchWorkoutsFromDb } from "@/lib/workouts/fetch";

export { parseSets, emptyTodaySessions, sessionCutoffDate } from "@/lib/workouts/transform";

let seedChecked = false;

export async function ensureSeeded() {
  if (!isSupabaseConfigured() || seedChecked) return;

  const supabase = createClient();
  const { count } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    seedChecked = true;
    return;
  }

  for (const [workoutIndex, workout] of SEED_WORKOUTS.entries()) {
    const { data: createdWorkout, error: workoutError } = await supabase
      .from("workouts")
      .insert({ name: workout.name, sort_order: workoutIndex + 1 })
      .select("id")
      .single();

    if (workoutError || !createdWorkout) {
      throw new Error(workoutError?.message ?? "Failed to seed workout");
    }

    const exercises = workout.exercises.map((exercise) => ({
      workout_id: createdWorkout.id,
      name: exercise.name,
      sets_reps: exercise.setsReps,
      sort_order: exercise.sortOrder,
    }));

    const { error: exerciseError } = await supabase.from("exercises").insert(exercises);
    if (exerciseError) {
      throw new Error(exerciseError.message);
    }
  }

  seedChecked = true;
}

export async function getWorkouts(): Promise<WorkoutWithMeta[]> {
  if (!isSupabaseConfigured()) return [];
  await ensureSeeded();
  return fetchWorkoutsFromDb(createClient());
}

export async function getWorkoutDetail(workoutId: string): Promise<WorkoutDetail | null> {
  if (!isSupabaseConfigured()) return null;
  await ensureSeeded();
  return fetchWorkoutDetailFromDb(createClient(), workoutId);
}
