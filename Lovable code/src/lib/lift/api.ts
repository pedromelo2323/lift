import { supabase } from "@/integrations/supabase/client";
import type {
  Exercise,
  ExerciseSet,
  HistoryEntry,
  Session,
  SessionNote,
  Workout,
  WorkoutDetail,
} from "./types";

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, position, last_completed_at")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Workout[];
}

export async function fetchWorkoutDetail(workoutId: string): Promise<WorkoutDetail> {
  const [workoutRes, exerciseRes, sessionRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, name, position, last_completed_at")
      .eq("id", workoutId)
      .single(),
    supabase
      .from("exercises")
      .select("id, workout_id, name, position, target_reps, note, linked_to_next")
      .eq("workout_id", workoutId)
      .order("position", { ascending: true }),
    supabase
      .from("sessions")
      .select("id, workout_id, date, skipped")
      .eq("workout_id", workoutId)
      .order("date", { ascending: false })
      .limit(8),
  ]);

  if (workoutRes.error) throw workoutRes.error;
  if (exerciseRes.error) throw exerciseRes.error;
  if (sessionRes.error) throw sessionRes.error;

  const sessions = (sessionRes.data ?? []) as Session[];
  let sets: ExerciseSet[] = [];
  let notes: SessionNote[] = [];
  if (sessions.length > 0) {
    const ids = sessions.map((s) => s.id);
    const [setRes, noteRes] = await Promise.all([
      supabase
        .from("exercise_sets")
        .select("id, session_id, exercise_id, set_index, weight, reps")
        .in("session_id", ids),
      supabase
        .from("session_notes")
        .select("id, session_id, exercise_id, body")
        .in("session_id", ids),
    ]);
    if (setRes.error) throw setRes.error;
    if (noteRes.error) throw noteRes.error;
    sets = (setRes.data ?? []) as ExerciseSet[];
    notes = (noteRes.data ?? []) as SessionNote[];
  }

  return {
    workout: workoutRes.data as Workout,
    exercises: (exerciseRes.data ?? []) as Exercise[],
    sessions,
    sets,
    notes,
  };
}

/** Creates today's session for a workout if it doesn't exist yet. */
const inflight = new Map<string, Promise<Session>>();

/** Concurrent callers share one lookup/insert so a day never gets two sessions. */
export function ensureTodaySession(workoutId: string): Promise<Session> {
  const key = `${workoutId}:${todayISO()}`;
  const running = inflight.get(key);
  if (running) return running;
  const p = createOrGetTodaySession(workoutId).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function createOrGetTodaySession(workoutId: string): Promise<Session> {
  const date = todayISO();
  const existing = await supabase
    .from("sessions")
    .select("id, workout_id, date, skipped")
    .eq("workout_id", workoutId)
    .eq("date", date)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as Session;

  const { data, error } = await supabase
    .from("sessions")
    .insert({ workout_id: workoutId, date })
    .select("id, workout_id, date, skipped")
    .single();
  if (error) throw error;

  await supabase.from("workouts").update({ last_completed_at: date }).eq("id", workoutId);
  return data as Session;
}

/** Marks today as deliberately skipped (or un-skips it). */
export async function setTodaySkipped(
  workoutId: string,
  skipped: boolean,
): Promise<void> {
  const session = await ensureTodaySession(workoutId);
  const { error } = await supabase
    .from("sessions")
    .update({ skipped })
    .eq("id", session.id);
  if (error) throw error;
}

export async function upsertSet(input: {
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  weight: number | null;
  reps: number | null;
}): Promise<void> {
  const { error } = await supabase.from("exercise_sets").upsert(
    {
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      set_index: input.setIndex,
      weight: input.weight,
      reps: input.reps,
    },
    { onConflict: "session_id,exercise_id,set_index" },
  );
  if (error) throw error;
}

export async function upsertSessionNote(input: {
  sessionId: string;
  exerciseId: string;
  body: string | null;
}): Promise<void> {
  const { error } = await supabase.from("session_notes").upsert(
    {
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      body: input.body,
    },
    { onConflict: "session_id,exercise_id" },
  );
  if (error) throw error;
}

/** Full timeline for one exercise, oldest session first. */
export async function fetchExerciseHistory(exerciseId: string): Promise<{
  exercise: Exercise;
  entries: HistoryEntry[];
}> {
  const exerciseRes = await supabase
    .from("exercises")
    .select("id, workout_id, name, position, target_reps, note, linked_to_next")
    .eq("id", exerciseId)
    .single();
  if (exerciseRes.error) throw exerciseRes.error;
  const exercise = exerciseRes.data as Exercise;

  const [sessionRes, setRes, noteRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, workout_id, date, skipped")
      .eq("workout_id", exercise.workout_id)
      .order("date", { ascending: true }),
    supabase
      .from("exercise_sets")
      .select("id, session_id, exercise_id, set_index, weight, reps")
      .eq("exercise_id", exerciseId),
    supabase
      .from("session_notes")
      .select("id, session_id, exercise_id, body")
      .eq("exercise_id", exerciseId),
  ]);
  if (sessionRes.error) throw sessionRes.error;
  if (setRes.error) throw setRes.error;
  if (noteRes.error) throw noteRes.error;

  const sessions = (sessionRes.data ?? []) as Session[];
  const sets = (setRes.data ?? []) as ExerciseSet[];
  const notes = (noteRes.data ?? []) as SessionNote[];

  const count = sets.reduce((acc, s) => Math.max(acc, s.set_index + 1), 0) || 1;

  const entries: HistoryEntry[] = sessions.map((session) => {
    const values = Array.from({ length: count }, () => ({
      weight: null as number | null,
      reps: null as number | null,
    }));
    for (const s of sets) {
      if (s.session_id !== session.id) continue;
      if (s.set_index < 0 || s.set_index >= count) continue;
      values[s.set_index] = {
        weight: s.weight == null ? null : Number(s.weight),
        reps: s.reps == null ? null : s.reps,
      };
    }
    return {
      date: session.date,
      skipped: session.skipped,
      values,
      note: notes.find((n) => n.session_id === session.id)?.body ?? null,
    };
  });

  return {
    exercise,
    entries: entries.filter(
      (e) => e.skipped || e.values.some((v) => v.weight != null || v.reps != null),
    ),
  };
}

export async function updateExercise(
  id: string,
  patch: Partial<Pick<Exercise, "name" | "note" | "position" | "target_reps" | "linked_to_next">>,
): Promise<void> {
  const { error } = await supabase.from("exercises").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateWorkout(
  id: string,
  patch: Partial<Pick<Workout, "name">>,
): Promise<void> {
  const { error } = await supabase.from("workouts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function addExercise(
  workoutId: string,
  name: string,
  position: number,
): Promise<void> {
  const { error } = await supabase
    .from("exercises")
    .insert({ workout_id: workoutId, name, position });
  if (error) throw error;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderExercises(
  ordered: { id: string; position: number; linked_to_next: boolean }[],
): Promise<void> {
  await Promise.all(
    ordered.map((e) =>
      updateExercise(e.id, { position: e.position, linked_to_next: e.linked_to_next }),
    ),
  );
}
