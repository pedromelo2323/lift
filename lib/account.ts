import { createClient } from "@/lib/supabase/client";
import { parseSets } from "@/lib/workouts/transform";

const DRAFT_PREFIX = "lift:session-draft:";

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Every logged set as CSV: one row per set, newest day first. */
export async function buildExportCsv(): Promise<string> {
  const supabase = createClient();
  const [workouts, exercises, sessions] = await Promise.all([
    supabase.from("workouts").select("id, name"),
    supabase.from("exercises").select("id, workout_id, name, sets_reps"),
    supabase
      .from("exercise_sessions")
      .select("exercise_id, session_date, sets, note")
      .order("session_date", { ascending: false }),
  ]);
  const failed = workouts.error ?? exercises.error ?? sessions.error;
  if (failed) throw new Error(failed.message);

  const workoutName = new Map((workouts.data ?? []).map((w) => [w.id, w.name]));
  const exerciseById = new Map((exercises.data ?? []).map((e) => [e.id, e]));

  const rows = [["Date", "Workout", "Exercise", "Target", "Set", "Weight", "Reps", "Note"]];
  for (const session of sessions.data ?? []) {
    const exercise = exerciseById.get(session.exercise_id);
    if (!exercise) continue;
    parseSets(session.sets).forEach((set, index) => {
      if (set.weight == null && set.reps == null) return;
      rows.push([
        session.session_date,
        workoutName.get(exercise.workout_id) ?? "",
        exercise.name,
        exercise.sets_reps ?? "",
        String(index + 1),
        set.weight == null ? "" : String(set.weight),
        set.reps == null ? "" : String(set.reps),
        index === 0 ? (session.note ?? "") : "",
      ]);
    });
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

/** Removes unsaved set drafts so the next person on this device starts clean. */
function clearLocalDrafts() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(DRAFT_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export async function signOut() {
  clearLocalDrafts();
  await createClient().auth.signOut({ scope: "local" });
}

/** Deletes the account and everything in it, then signs out on this device. */
export async function deleteAccount() {
  const { error } = await createClient().rpc("delete_my_account");
  if (error) throw new Error(error.message);
  await signOut();
}
