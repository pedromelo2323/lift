import { createClient } from "@/lib/supabase/client";
import { getTodayDateString } from "@/lib/utils/date";
import type { ExerciseWithData, SetEntry } from "@/types";
import { emptyTodaySessions } from "@/lib/workouts/transform";

function supabase() {
  return createClient();
}

export async function updateWorkoutName(workoutId: string, name: string) {
  const { error } = await supabase().from("workouts").update({ name }).eq("id", workoutId);
  if (error) throw new Error(error.message);
}

export async function updateExerciseName(exerciseId: string, name: string) {
  const { error } = await supabase().from("exercises").update({ name }).eq("id", exerciseId);
  if (error) throw new Error(error.message);
}

export async function updateExerciseNote(
  exerciseId: string,
  note: string,
  currentSets?: SetEntry[],
) {
  const sessionDate = getTodayDateString();
  const trimmed = note.trim();
  const client = supabase();

  const { data: existing } = await client
    .from("exercise_sessions")
    .select("sets")
    .eq("exercise_id", exerciseId)
    .eq("session_date", sessionDate)
    .maybeSingle();

  const fallbackSets: SetEntry[] = [
    { weight: null, reps: null },
    { weight: null, reps: null },
    { weight: null, reps: null },
  ];

  const sets = currentSets ?? (existing?.sets ? parseLooseSets(existing.sets) : fallbackSets);

  const { error } = await client.from("exercise_sessions").upsert(
    {
      exercise_id: exerciseId,
      session_date: sessionDate,
      sets,
      note: trimmed || null,
    },
    { onConflict: "exercise_id,session_date" },
  );

  if (error) {
    // Column may not exist yet — fall back to legacy exercise_notes.
    if (!trimmed) {
      const { error: delError } = await client
        .from("exercise_notes")
        .delete()
        .eq("exercise_id", exerciseId);
      if (delError) throw new Error(delError.message);
      return;
    }
    const { error: legacyError } = await client.from("exercise_notes").upsert({
      exercise_id: exerciseId,
      note: trimmed,
      updated_at: new Date().toISOString(),
    });
    if (legacyError) throw new Error(error.message);
  }
}

function parseLooseSets(raw: unknown): SetEntry[] {
  if (!Array.isArray(raw)) {
    return [
      { weight: null, reps: null },
      { weight: null, reps: null },
      { weight: null, reps: null },
    ];
  }
  return raw.map((entry) => {
    if (typeof entry !== "object" || entry === null) return { weight: null, reps: null };
    const item = entry as { weight?: unknown; reps?: unknown };
    return {
      weight: typeof item.weight === "number" ? item.weight : null,
      reps: typeof item.reps === "number" ? item.reps : null,
    };
  });
}

export async function upsertExerciseSession(
  exerciseId: string,
  sets: SetEntry[],
  options?: { keepalive?: boolean; sessionDate?: string; note?: string | null },
) {
  const sessionDate = options?.sessionDate ?? getTodayDateString();
  const payload: {
    exercise_id: string;
    session_date: string;
    sets: SetEntry[];
    note?: string | null;
  } = {
    exercise_id: exerciseId,
    session_date: sessionDate,
    sets,
  };
  if (options && "note" in options) {
    payload.note = options.note ?? null;
  }

  // iOS kills pending XHR when the PWA is backgrounded; keepalive can finish the write.
  if (options?.keepalive) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing Supabase environment variables.");

    const response = await fetch(
      `${url}/rest/v1/exercise_sessions?on_conflict=exercise_id,session_date`,
      {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to save session (${response.status})`);
    }
    return;
  }

  const { error } = await supabase().from("exercise_sessions").upsert(payload, {
    onConflict: "exercise_id,session_date",
  });
  if (error) throw new Error(error.message);
}

export async function deleteExerciseSession(exerciseId: string, sessionDate: string) {
  const { error } = await supabase()
    .from("exercise_sessions")
    .delete()
    .eq("exercise_id", exerciseId)
    .eq("session_date", sessionDate);
  if (error) throw new Error(error.message);
}

export async function addExercise(workoutId: string, name: string): Promise<ExerciseWithData> {
  const client = supabase();
  const { data: existing } = await client
    .from("exercises")
    .select("sort_order")
    .eq("workout_id", workoutId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  const today = getTodayDateString();

  const { data, error } = await client
    .from("exercises")
    .insert({
      workout_id: workoutId,
      name: name.trim() || "New exercise",
      sort_order: nextOrder,
    })
    .select("id, workout_id, name, sets_reps, sort_order, created_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add exercise");

  return {
    ...data,
    note: null,
    sessions: emptyTodaySessions(data.id, today),
  };
}

export async function deleteExercise(exerciseId: string) {
  const { error } = await supabase().from("exercises").delete().eq("id", exerciseId);
  if (error) throw new Error(error.message);
}

export async function reorderExercise(
  workoutId: string,
  exerciseId: string,
  direction: "up" | "down",
) {
  const client = supabase();
  const { data: exercises, error } = await client
    .from("exercises")
    .select("id, sort_order")
    .eq("workout_id", workoutId)
    .order("sort_order");

  if (error || !exercises) throw new Error(error?.message ?? "Failed to load exercises");

  const index = exercises.findIndex((e) => e.id === exerciseId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= exercises.length) return;

  const current = exercises[index]!;
  const target = exercises[swapIndex]!;

  const [{ error: a }, { error: b }] = await Promise.all([
    client.from("exercises").update({ sort_order: target.sort_order }).eq("id", current.id),
    client.from("exercises").update({ sort_order: current.sort_order }).eq("id", target.id),
  ]);

  if (a || b) throw new Error(a?.message ?? b?.message ?? "Failed to reorder");
}
