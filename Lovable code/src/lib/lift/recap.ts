import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./api";

export type Recap = {
  sessions: number;
  heavier: number;
  weekStart: string;
  /** Biggest gain since the first logged session, if any. */
  sinceStart: { name: string; from: number; to: number } | null;
  totalSessions: number;
};

function daysAgoISO(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * Sessions logged in the last 7 days and how many exercises went heavier than
 * the time before. Computed from data the user already owns; no new tables.
 */
export async function fetchRecap(): Promise<Recap> {
  const from = daysAgoISO(7);
  const [sessionRes, setRes, exRes] = await Promise.all([
    supabase.from("sessions").select("id, date"),
    supabase.from("exercise_sets").select("session_id, exercise_id, set_index, weight, reps"),
    supabase.from("exercises").select("id, name"),
  ]);
  if (exRes.error) throw exRes.error;
  if (sessionRes.error) throw sessionRes.error;
  if (setRes.error) throw setRes.error;

  const sessions = sessionRes.data ?? [];
  const sets = setRes.data ?? [];
  const dateOf = new Map(sessions.map((s) => [s.id, s.date]));

  const recent = sessions.filter((s) => s.date >= from && s.date <= todayISO());

  // Best weight per exercise, this week vs. everything before it.
  const thisWeek = new Map<string, number>();
  const before = new Map<string, number>();
  for (const s of sets) {
    const date = dateOf.get(s.session_id);
    if (!date || s.weight == null) continue;
    const weight = Number(s.weight);
    const bucket = date >= from ? thisWeek : before;
    bucket.set(s.exercise_id, Math.max(bucket.get(s.exercise_id) ?? 0, weight));
  }

  let heavier = 0;
  for (const [exerciseId, weight] of thisWeek) {
    const previous = before.get(exerciseId);
    if (previous != null && weight > previous) heavier += 1;
  }

  // First-session best vs. all-time best, per exercise.
  const first = new Map<string, { date: string; weight: number }>();
  const top = new Map<string, number>();
  for (const s of sets) {
    const date = dateOf.get(s.session_id);
    if (!date || s.weight == null) continue;
    const weight = Number(s.weight);
    const f = first.get(s.exercise_id);
    if (!f || date < f.date) first.set(s.exercise_id, { date, weight });
    else if (date === f.date && weight > f.weight) f.weight = weight;
    top.set(s.exercise_id, Math.max(top.get(s.exercise_id) ?? 0, weight));
  }
  const names = new Map((exRes.data ?? []).map((e) => [e.id, e.name]));
  let sinceStart: Recap["sinceStart"] = null;
  for (const [id, f] of first) {
    const to = top.get(id) ?? 0;
    const gain = to - f.weight;
    if (gain > 0 && (!sinceStart || gain / f.weight > (sinceStart.to - sinceStart.from) / sinceStart.from)) {
      sinceStart = { name: names.get(id) ?? "", from: f.weight, to };
    }
  }

  const logged = new Set(sets.map((s) => s.session_id));
  return {
    sessions: recent.filter((s) => logged.has(s.id)).length,
    heavier,
    weekStart: from,
    sinceStart,
    totalSessions: sessions.filter((s) => logged.has(s.id)).length,
  };
}
