import { supabase } from "@/integrations/supabase/client";
import type { Template } from "./templates";
import { formatValue } from "./model";

export async function fetchProfile(): Promise<{ display_name: string | null } | null> {
  const { data: auth } = await supabase.auth.getUser();
  const id = auth.user?.id;
  if (!id) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const fallback =
    (auth.user?.user_metadata?.["full_name"] as string | undefined) ??
    auth.user?.email?.split("@")[0] ??
    null;
  await supabase.from("profiles").insert({ id, display_name: fallback });
  return { display_name: fallback };
}

export async function updateDisplayName(name: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const id = auth.user?.id;
  if (!id) return;
  const { error } = await supabase
    .from("profiles")
    .upsert({ id, display_name: name }, { onConflict: "id" });
  if (error) throw error;
}

async function hasWorkouts(): Promise<boolean> {
  const { count, error } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Creates the workouts and exercises of a starter plan. No-op if the user already has workouts. */
export async function applyTemplate(template: Template): Promise<void> {
  if (await hasWorkouts()) return;
  for (const [index, workout] of template.workouts.entries()) {
    const { data, error } = await supabase
      .from("workouts")
      .insert({ name: workout.name, position: index })
      .select("id")
      .single();
    if (error) throw error;
    if (workout.exercises.length === 0) continue;
    const { error: exError } = await supabase.from("exercises").insert(
      workout.exercises.map((e, i) => ({
        workout_id: data.id,
        name: e.name,
        position: i,
        target_reps: e.target_reps ?? null,
        linked_to_next: e.linked_to_next ?? false,
      })),
    );
    if (exError) throw exError;
  }
}

/** Closest ready plan for a given training frequency. */
export function fallbackTemplateId(days: number): string {
  return days <= 3 ? (days <= 2 ? "full-body" : "ppl") : days === 4 ? "upper-lower" : "ppl";
}

/** Creates empty named workouts. No-op if the user already has workouts. */
export async function createCustomWorkouts(names: string[]): Promise<void> {
  if (await hasWorkouts()) return;
  const rows = names.map((name, position) => ({ name, position }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("workouts").insert(rows);
  if (error) throw error;
}

export async function createEmptyWorkout(name: string): Promise<void> {
  await createCustomWorkouts([name]);
}

function csvCell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV of every logged set for the signed-in user. */
export async function buildExportCsv(): Promise<string> {
  const [workoutsRes, exercisesRes, sessionsRes, setsRes] = await Promise.all([
    supabase.from("workouts").select("id, name"),
    supabase.from("exercises").select("id, workout_id, name"),
    supabase.from("sessions").select("id, workout_id, date"),
    supabase.from("exercise_sets").select("session_id, exercise_id, set_index, weight, reps"),
  ]);
  for (const res of [workoutsRes, exercisesRes, sessionsRes, setsRes]) {
    if (res.error) throw res.error;
  }
  const workouts = new Map((workoutsRes.data ?? []).map((w) => [w.id, w.name]));
  const exercises = new Map((exercisesRes.data ?? []).map((e) => [e.id, e.name]));
  const sessions = new Map((sessionsRes.data ?? []).map((s) => [s.id, s]));

  const rows = (setsRes.data ?? [])
    .map((s) => {
      const session = sessions.get(s.session_id);
      return {
        date: session?.date ?? "",
        workout: workouts.get(session?.workout_id ?? "") ?? "",
        exercise: exercises.get(s.exercise_id) ?? "",
        set: s.set_index + 1,
        weight: s.weight == null ? null : Number(s.weight),
        reps: s.reps,
      };
    })
    .sort((a, b) =>
      a.date === b.date
        ? a.exercise.localeCompare(b.exercise) || a.set - b.set
        : a.date.localeCompare(b.date),
    );

  const header = ["Date", "Workout", "Exercise", "Set", "Weight (kg)", "Reps"];
  return [
    header.join(","),
    ...rows.map((r) =>
      [r.date, r.workout, r.exercise, r.set, r.weight, r.reps].map(csvCell).join(","),
    ),
  ].join("\n");
}

export { formatValue };
