import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  ExerciseSession,
  ExerciseWithData,
  WorkoutDetail,
  WorkoutWithMeta,
} from "@/types";
import { getTodayDateString } from "@/lib/utils/date";
import { emptyTodaySessions, parseSets, sessionCutoffDate } from "@/lib/workouts/transform";

type Client = SupabaseClient<Database>;

export async function fetchWorkoutsFromDb(supabase: Client): Promise<WorkoutWithMeta[]> {
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("id, name, sort_order, created_at")
    .order("sort_order");

  if (error || !workouts) {
    throw new Error(error?.message ?? "Failed to load workouts");
  }

  const { data: allExercises } = await supabase.from("exercises").select("id, workout_id");

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

export async function fetchWorkoutDetailFromDb(
  supabase: Client,
  workoutId: string,
): Promise<WorkoutDetail | null> {
  const today = getTodayDateString();
  const cutoff = sessionCutoffDate();

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

  let sessions: {
    id: string;
    exercise_id: string;
    session_date: string;
    sets: unknown;
    note?: string | null;
    created_at: string;
  }[] | null = null;

  if (exerciseIds.length) {
    const withNote = await supabase
      .from("exercise_sessions")
      .select("id, exercise_id, session_date, sets, note, created_at")
      .in("exercise_id", exerciseIds)
      .gte("session_date", cutoff)
      .order("session_date", { ascending: false });

    if (withNote.error) {
      const withoutNote = await supabase
        .from("exercise_sessions")
        .select("id, exercise_id, session_date, sets, created_at")
        .in("exercise_id", exerciseIds)
        .gte("session_date", cutoff)
        .order("session_date", { ascending: false });
      if (withoutNote.error) throw new Error(withoutNote.error.message);
      sessions = withoutNote.data;
    } else {
      sessions = withNote.data;
    }
  }

  const notesResult = exerciseIds.length
    ? await supabase
        .from("exercise_notes")
        .select("exercise_id, note, updated_at")
        .in("exercise_id", exerciseIds)
    : { data: [] as { exercise_id: string; note: string; updated_at: string }[] };

  const notes = notesResult.data;

  const sessionsByExercise = new Map<string, ExerciseSession[]>();
  for (const session of sessions ?? []) {
    const parsed: ExerciseSession = {
      id: session.id,
      exercise_id: session.exercise_id,
      session_date: session.session_date,
      sets: parseSets(session.sets),
      note: session.note ?? null,
      created_at: session.created_at,
    };
    const list = sessionsByExercise.get(session.exercise_id) ?? [];
    list.push(parsed);
    sessionsByExercise.set(session.exercise_id, list);
  }

  const legacyNotes = new Map((notes ?? []).map((n) => [n.exercise_id, n.note]));

  const exercisesWithData: ExerciseWithData[] = exercises.map((exercise) => {
    // history is newest-first from the query
    const historyNewestFirst = (sessionsByExercise.get(exercise.id) ?? []).filter(
      (s) => s.session_date !== today,
    );
    const todaySession = (sessionsByExercise.get(exercise.id) ?? []).find(
      (s) => s.session_date === today,
    );
    const latest = historyNewestFirst[0];

    // Display: oldest → newest (up to 3), then Today last
    const historyOldestFirst = [...historyNewestFirst.slice(0, 3)].reverse();

    let sessionsForExercise = [...historyOldestFirst];
    if (todaySession) {
      sessionsForExercise = [
        ...sessionsForExercise,
        {
          ...todaySession,
          note: todaySession.note ?? legacyNotes.get(exercise.id) ?? null,
        },
      ];
    } else if (latest) {
      sessionsForExercise = [
        ...sessionsForExercise,
        {
          id: `temp-${exercise.id}`,
          exercise_id: exercise.id,
          session_date: today,
          sets: latest.sets.map((set) => ({ ...set })),
          note: null,
          created_at: new Date().toISOString(),
        },
      ];
    } else {
      sessionsForExercise = [...sessionsForExercise, ...emptyTodaySessions(exercise.id, today)];
    }

    const todayRow = sessionsForExercise.find((s) => s.session_date === today);
    return {
      ...exercise,
      note: todayRow?.note ?? null,
      sessions: sessionsForExercise,
    };
  });

  return { ...workout, exercises: exercisesWithData };
}

export type ExerciseHistoryEntry = {
  date: string;
  sets: ExerciseSession["sets"];
  note: string | null;
};

export type ExerciseHistory = {
  exercise: {
    id: string;
    workout_id: string;
    name: string;
    sets_reps: string | null;
  };
  entries: ExerciseHistoryEntry[];
};

/** Full timeline for one exercise, oldest session first. */
export async function fetchExerciseHistoryFromDb(
  supabase: Client,
  exerciseId: string,
): Promise<ExerciseHistory | null> {
  const { data: exercise, error } = await supabase
    .from("exercises")
    .select("id, workout_id, name, sets_reps")
    .eq("id", exerciseId)
    .single();

  if (error || !exercise) return null;

  const { data: sessions, error: sessionsError } = await supabase
    .from("exercise_sessions")
    .select("id, session_date, sets, note, created_at")
    .eq("exercise_id", exerciseId)
    .order("session_date", { ascending: true });

  type SessionRow = {
    id: string;
    session_date: string;
    sets: unknown;
    note?: string | null;
    created_at: string;
  };

  let rows: SessionRow[] | null = sessions as SessionRow[] | null;
  if (sessionsError) {
    const fallback = await supabase
      .from("exercise_sessions")
      .select("id, session_date, sets, created_at")
      .eq("exercise_id", exerciseId)
      .order("session_date", { ascending: true });
    if (fallback.error) throw new Error(fallback.error.message);
    rows = fallback.data as SessionRow[] | null;
  }

  const entries: ExerciseHistoryEntry[] = (rows ?? [])
    .map((session) => ({
      date: session.session_date,
      sets: parseSets(session.sets),
      note: session.note ?? null,
    }))
    .filter((entry) => entry.sets.some((s) => s.weight != null || s.reps != null) || entry.note);

  return { exercise, entries };
}
