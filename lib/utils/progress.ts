import type { SetEntry } from "@/types";

export function isBetter(a: SetEntry, b: SetEntry | undefined): boolean {
  if (!b) return false;
  if (a.weight == null || a.reps == null || b.weight == null || b.reps == null) return false;
  if (a.weight > b.weight) return true;
  if (a.weight === b.weight && a.reps > b.reps) return true;
  return false;
}

function sameSet(a: SetEntry, b: SetEntry): boolean {
  return a.weight === b.weight && a.reps === b.reps;
}

function hasValues(sets: SetEntry[]): boolean {
  return sets.some((s) => s.weight != null || s.reps != null);
}

/** Set indexes identical across the last three logged past sessions. */
export function stalledSetIndexes(historyNewestFirst: { sets: SetEntry[] }[]): number[] {
  const logged = historyNewestFirst.filter((s) => hasValues(s.sets)).slice(0, 3);
  if (logged.length < 3) return [];

  const count = Math.max(...logged.map((s) => s.sets.length), 3);
  const stalled: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const first = logged[0]!.sets[i];
    if (!first || first.weight == null || first.reps == null) continue;
    if (logged.every((s) => s.sets[i] && sameSet(s.sets[i]!, first))) stalled.push(i);
  }
  return stalled;
}
