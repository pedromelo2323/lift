"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils/date";
import type { SetEntry } from "@/types";

export async function updateWorkoutName(workoutId: string, name: string) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { error } = await supabase.from("workouts").update({ name }).eq("id", workoutId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}

export async function updateExerciseName(exerciseId: string, workoutId: string, name: string) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { error } = await supabase.from("exercises").update({ name }).eq("id", exerciseId);

  if (error) return { error: error.message };

  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}

export async function updateExerciseNote(
  exerciseId: string,
  workoutId: string,
  note: string,
) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const trimmed = note.trim();

  if (!trimmed) {
    await supabase.from("exercise_notes").delete().eq("exercise_id", exerciseId);
  } else {
    await supabase.from("exercise_notes").upsert({
      exercise_id: exerciseId,
      note: trimmed,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}

export async function upsertExerciseSession(
  exerciseId: string,
  workoutId: string,
  sets: SetEntry[],
) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const sessionDate = getTodayDateString();

  const { error } = await supabase.from("exercise_sessions").upsert(
    {
      exercise_id: exerciseId,
      session_date: sessionDate,
      sets,
    },
    { onConflict: "exercise_id,session_date" },
  );

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}

export async function addExercise(workoutId: string, name: string) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("exercises")
    .select("sort_order")
    .eq("workout_id", workoutId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("exercises").insert({
    workout_id: workoutId,
    name: name.trim() || "New Exercise",
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };

  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}

export async function deleteExercise(exerciseId: string, workoutId: string) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);

  if (error) return { error: error.message };

  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}

export async function reorderExercise(
  exerciseId: string,
  workoutId: string,
  direction: "up" | "down",
) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, sort_order")
    .eq("workout_id", workoutId)
    .order("sort_order");

  if (error || !exercises) return { error: error?.message ?? "Failed to load exercises" };

  const index = exercises.findIndex((e) => e.id === exerciseId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= exercises.length) {
    return { success: true };
  }

  const current = exercises[index];
  const target = exercises[swapIndex];

  await Promise.all([
    supabase.from("exercises").update({ sort_order: target.sort_order }).eq("id", current.id),
    supabase.from("exercises").update({ sort_order: current.sort_order }).eq("id", target.id),
  ]);

  revalidatePath(`/workout/${workoutId}`);
  return { success: true };
}
