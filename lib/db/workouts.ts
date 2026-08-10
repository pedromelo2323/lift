import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SEED_WORKOUTS } from "@/lib/seed/workouts";
import type {
  ExerciseSession,
  ExerciseWithData,
  SetEntry,
  WorkoutDetail,
  WorkoutWithMeta,
} from "@/types";
import { getTodayDateString } from "@/lib/utils/date";

let seedChecked = false;

function parseSets(raw: unknown): SetEntry[] {
  if (!Array.isArray(raw)) {
    return [
      { weight: null, reps: null },
      { weight: null, reps: null },
      { weight: null, reps: null },
    ];
  }

  return raw.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      return { weight: null, reps: null };
    }
    const item = entry as { weight?: unknown; reps?: unknown };
    return {
      weight: typeof item.weight === "number" ? item.weight : null,
      reps: typeof item.reps === "number" ? item.reps : null,
    };
  });
}

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
  const supabase = createClient();

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("id, name, sort_order, created_at")
    .order("sort_order");

  if (error || !workouts) {
    throw new Error(error?.message ?? "Failed to load workouts");
  }

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, workout_id");

  const exerciseIdsByWorkout = new Map<string, string[]>();
  for (const exercise of allExercises ?? []) {
    const list = exerciseIdsByWorkout.get(exercise.workout_id) ?? [];
    list.push(exercise.id);
    exerciseIdsByWorkout.set(exercise.workout_id, list);
  }

  const allExerciseIds = (allExercises ?? []).map((e) => e.id);
  const lastDateByExercise = new Map<string, string>();

  if (allExerciseIds.length > 0) {
    const { data: sessions } = await supabase
      .from("exercise_sessions")
      .select("exercise_id, session_date")
      .in("exercise_id", allExerciseIds)
      .order("session_date", { ascending: false });

    for (const session of sessions ?? []) {
      if (!lastDateByExercise.has(session.exercise_id)) {
        lastDateByExercise.set(session.exercise_id, session.session_date);
      }
    }
  }

  return workouts.map((workout) => {
    const exerciseIds = exerciseIdsByWorkout.get(workout.id) ?? [];
    let last_completed_date: string | null = null;

    for (const exerciseId of exerciseIds) {
      const date = lastDateByExercise.get(exerciseId);
      if (date && (!last_completed_date || date > last_completed_date)) {
        last_completed_date = date;
      }
    }

    return { ...workout, last_completed_date };
  });
}

export async function getWorkoutDetail(workoutId: string): Promise<WorkoutDetail | null> {
  if (!isSupabaseConfigured()) return null;

  await ensureSeeded();
  const supabase = createClient();
  const today = getTodayDateString();

  const { data: workout, error } = await supabase
    .from("workouts")
    .select("id, name, sort_order, created_at")
    .eq("id", workoutId)
    .single();

  if (error || !workout) return null;

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, workout_id, name, sets_reps, sort_order, created_at")
    .eq("workout_id", workoutId)
    .order("sort_order");

  if (exercisesError || !exercises) {
    throw new Error(exercisesError?.message ?? "Failed to load exercises");
  }

  const exerciseIds = exercises.map((e) => e.id);

  const [{ data: sessions }, { data: notes }] = await Promise.all([
    exerciseIds.length
      ? supabase
          .from("exercise_sessions")
          .select("id, exercise_id, session_date, sets, created_at")
          .in("exercise_id", exerciseIds)
          .order("session_date", { ascending: false })
      : Promise.resolve({ data: [] as ExerciseSession[] }),
    exerciseIds.length
      ? supabase.from("exercise_notes").select("exercise_id, note, updated_at").in("exercise_id", exerciseIds)
      : Promise.resolve({ data: [] as { exercise_id: string; note: string; updated_at: string }[] }),
  ]);

  const sessionsByExercise = new Map<string, ExerciseSession[]>();
  for (const session of sessions ?? []) {
    const parsed: ExerciseSession = {
      ...session,
      sets: parseSets(session.sets),
    };
    const list = sessionsByExercise.get(session.exercise_id) ?? [];
    list.push(parsed);
    sessionsByExercise.set(session.exercise_id, list);
  }

  const notesByExercise = new Map((notes ?? []).map((n) => [n.exercise_id, n.note]));

  const exercisesWithData: ExerciseWithData[] = exercises.map((exercise) => {
    const history = (sessionsByExercise.get(exercise.id) ?? []).filter(
      (s) => s.session_date !== today,
    );
    const todaySession = (sessionsByExercise.get(exercise.id) ?? []).find(
      (s) => s.session_date === today,
    );
    const latest = history[0];

    let sessionsForExercise = [...history.slice(0, 3)];
    if (todaySession) {
      sessionsForExercise = [...sessionsForExercise, todaySession];
    } else if (latest) {
      sessionsForExercise = [
        ...sessionsForExercise,
        {
          id: `temp-${exercise.id}`,
          exercise_id: exercise.id,
          session_date: today,
          sets: latest.sets.map((set) => ({ ...set })),
          created_at: new Date().toISOString(),
        },
      ];
    } else {
      sessionsForExercise = [
        ...sessionsForExercise,
        {
          id: `temp-${exercise.id}`,
          exercise_id: exercise.id,
          session_date: today,
          sets: [
            { weight: null, reps: null },
            { weight: null, reps: null },
            { weight: null, reps: null },
          ],
          created_at: new Date().toISOString(),
        },
      ];
    }

    return {
      ...exercise,
      note: notesByExercise.get(exercise.id) ?? null,
      sessions: sessionsForExercise,
    };
  });

  return { ...workout, exercises: exercisesWithData };
}
