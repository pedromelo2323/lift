import type { ExerciseSet, Session, WorkoutDetail } from "./types";
import { DEFAULT_SET_COUNT, HISTORY_LENGTH } from "./types";
import { todayISO } from "./api";
import { toDisplayWeight } from "./prefs";

export type SetValue = { weight: number | null; reps: number | null };

export type TableRow = {
  key: string;
  label: string;
  isToday: boolean;
  skipped: boolean;
  sessionId: string | null;
  values: SetValue[];
  /** Values inherited from the last session, shown faintly until edited. */
  suggested: boolean[];
  /** Today only: this set beats the same set last session. */
  improved: boolean[];
};

const EMPTY: SetValue = { weight: null, reps: null };

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatValue(value: SetValue): string {
  if (value.weight == null && value.reps == null) return "—";
  const weight = value.weight == null ? "" : String(toDisplayWeight(Number(value.weight)));
  const reps = value.reps == null ? "" : String(value.reps);
  if (!weight) return reps;
  if (!reps) return weight;
  return `${weight}×${reps}`;
}

function setsFor(sets: ExerciseSet[], sessionId: string, exerciseId: string, count: number) {
  const values: SetValue[] = Array.from({ length: count }, () => ({ ...EMPTY }));
  for (const s of sets) {
    if (s.session_id !== sessionId || s.exercise_id !== exerciseId) continue;
    if (s.set_index < 0 || s.set_index >= count) continue;
    values[s.set_index] = {
      weight: s.weight == null ? null : Number(s.weight),
      reps: s.reps == null ? null : s.reps,
    };
  }
  return values;
}

function hasValues(values: SetValue[]) {
  return values.some((v) => v.weight != null || v.reps != null);
}

/** True when `a` is a better set than `b` (heavier, or same weight for more reps). */
export function isBetter(a: SetValue, b: SetValue): boolean {
  if (a.weight == null || a.reps == null || b.weight == null || b.reps == null) return false;
  if (a.weight > b.weight) return true;
  if (a.weight === b.weight && a.reps > b.reps) return true;
  return false;
}

function sameSet(a: SetValue, b: SetValue): boolean {
  return a.weight === b.weight && a.reps === b.reps;
}

export function setCountFor(detail: WorkoutDetail, exerciseId: string): number {
  const max = detail.sets
    .filter((s) => s.exercise_id === exerciseId)
    .reduce((acc, s) => Math.max(acc, s.set_index + 1), 0);
  return Math.max(DEFAULT_SET_COUNT, max);
}

function pastSessions(detail: WorkoutDetail, exerciseId: string, count: number) {
  const today = todayISO();
  return detail.sessions
    .filter((s: Session) => s.date < today)
    .slice()
    // newest first, so the most recent sessions are kept
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((s) => ({ session: s, values: setsFor(detail.sets, s.id, exerciseId, count) }))
    .filter((r) => r.session.skipped || hasValues(r.values));
}

/**
 * Builds the comparison table for one exercise: up to three past sessions
 * with recorded values, plus today's row pre-filled from the latest one.
 */
export function buildRows(detail: WorkoutDetail, exerciseId: string): TableRow[] {
  const count = setCountFor(detail, exerciseId);
  const today = todayISO();

  const past = pastSessions(detail, exerciseId, count)
    .slice(0, HISTORY_LENGTH)
    // then flipped to oldest -> newest for display
    .reverse();

  const todaySession = detail.sessions.find((s) => s.date === today) ?? null;
  const todayValues = todaySession
    ? setsFor(detail.sets, todaySession.id, exerciseId, count)
    : Array.from({ length: count }, () => ({ ...EMPTY }));

  const lastLogged = past.filter((p) => hasValues(p.values));
  const latest = lastLogged.length > 0 ? lastLogged[lastLogged.length - 1]!.values : null;
  const suggested: boolean[] = [];
  const improved: boolean[] = [];
  const merged = todayValues.map((value, i) => {
    const empty = value.weight == null && value.reps == null;
    if (empty && latest) {
      suggested.push(true);
      improved.push(false);
      return { ...latest[i]! };
    }
    suggested.push(false);
    improved.push(latest ? isBetter(value, latest[i]!) : false);
    return value;
  });

  return [
    ...past.map((r) => ({
      key: r.session.id,
      label: formatDay(r.session.date),
      isToday: false,
      skipped: r.session.skipped && !hasValues(r.values),
      sessionId: r.session.id,
      values: r.values,
      suggested: r.values.map(() => false),
      improved: r.values.map(() => false),
    })),
    {
      key: "today",
      label: "Today",
      isToday: true,
      skipped: (todaySession?.skipped ?? false) && !hasValues(todayValues),
      sessionId: todaySession?.id ?? null,
      values: merged,
      suggested,
      improved,
    },
  ];
}

/**
 * Set indexes that have been identical for the last three logged sessions —
 * a quiet hint that it may be time to change something.
 */
export function stalledSets(detail: WorkoutDetail, exerciseId: string): number[] {
  const count = setCountFor(detail, exerciseId);
  const logged = pastSessions(detail, exerciseId, count)
    .filter((p) => hasValues(p.values))
    .slice(0, 3);
  if (logged.length < 3) return [];

  const stalled: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const first = logged[0]!.values[i]!;
    if (first.weight == null || first.reps == null) continue;
    if (logged.every((l) => sameSet(l.values[i]!, first))) stalled.push(i);
  }
  return stalled;
}

/** Today's note for an exercise plus the note from the previous session. */
export function notesFor(detail: WorkoutDetail, exerciseId: string) {
  const today = todayISO();
  const todaySession = detail.sessions.find((s) => s.date === today) ?? null;
  const previous = detail.sessions
    .filter((s) => s.date < today)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const noteOf = (sessionId: string | undefined) =>
    sessionId
      ? (detail.notes.find(
          (n) => n.session_id === sessionId && n.exercise_id === exerciseId,
        )?.body ?? null)
      : null;

  const lastWithNote = previous.find((s) => noteOf(s.id));

  return {
    today: noteOf(todaySession?.id),
    previous: lastWithNote
      ? { date: lastWithNote.date, body: noteOf(lastWithNote.id)! }
      : null,
  };
}

/**
 * Best set ever recorded for an exercise before today — used to flash a mark
 * the moment today's set beats it.
 */
export function previousBest(detail: WorkoutDetail, exerciseId: string): SetValue | null {
  const today = todayISO();
  const pastIds = new Set(
    detail.sessions.filter((s) => s.date < today).map((s) => s.id),
  );
  let best: SetValue | null = null;
  for (const s of detail.sets) {
    if (s.exercise_id !== exerciseId || !pastIds.has(s.session_id)) continue;
    const value: SetValue = {
      weight: s.weight == null ? null : Number(s.weight),
      reps: s.reps,
    };
    if (value.weight == null || value.reps == null) continue;
    if (best == null || isBetter(value, best)) best = value;
  }
  return best;
}

/** Top of a target like "8–10" or "12". */
function topOfRange(target: string | null): number | null {
  if (!target) return null;
  const nums = target.match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : null;
}

/**
 * A nudge when the last session hit the top of the rep range on every set:
 * time to push for a bit more.
 */
export function progressionHint(
  detail: WorkoutDetail,
  exerciseId: string,
): string | null {
  const exercise = detail.exercises.find((e) => e.id === exerciseId);
  const top = topOfRange(exercise?.target_reps ?? null);
  if (top == null) return null;
  const count = setCountFor(detail, exerciseId);
  const last = pastSessions(detail, exerciseId, count).find((p) => hasValues(p.values));
  if (!last) return null;
  const done = last.values.filter((v) => v.reps != null);
  if (done.length === 0 || !done.every((v) => (v.reps ?? 0) >= top)) return null;
  return `You hit ${top} on every set last time. Push for a little more today.`;
}

/** Estimated one-rep max, used only to draw a trend line. */
export function strengthScore(values: SetValue[]): number | null {
  let best: number | null = null;
  for (const v of values) {
    if (v.weight == null || v.reps == null || v.reps <= 0) continue;
    const score = v.weight * (1 + v.reps / 30);
    if (best == null || score > best) best = score;
  }
  return best;
}
