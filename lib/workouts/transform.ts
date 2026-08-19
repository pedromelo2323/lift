import type { SetEntry } from "@/types";

export function parseSets(raw: unknown): SetEntry[] {
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

export function emptyTodaySessions(exerciseId: string, today: string) {
  return [
    {
      id: `temp-${exerciseId}`,
      exercise_id: exerciseId,
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

export function sessionCutoffDate(days = 120): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
