"use client";

import { useRouter } from "next/navigation";
import { formatSessionDate, formatSetValue } from "@/lib/utils/date";
import { isBetter } from "@/lib/utils/progress";
import { useExerciseHistory } from "@/hooks/use-workouts";
import type { SetEntry } from "@/types";

type ExerciseHistoryClientProps = {
  exerciseId: string;
};

export function ExerciseHistoryClient({ exerciseId }: ExerciseHistoryClientProps) {
  const router = useRouter();
  const { data, isPending, isError } = useExerciseHistory(exerciseId);

  const entries = data?.entries ?? [];
  const setCount = entries.reduce((acc, e) => Math.max(acc, e.sets.length), 0) || 3;

  const best = entries
    .flatMap((e) => e.sets)
    .reduce<SetEntry | null>((acc, value) => {
      if (acc == null || isBetter(value, acc)) return value;
      return acc;
    }, null);

  return (
    <div className="px-6 pb-20 pt-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground"
      >
        <span aria-hidden>‹</span>
        Back
      </button>

      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">
        {data?.exercise.name ?? " "}
      </h1>
      {best && best.weight != null ? (
        <p className="mt-1 text-[15px] text-muted-foreground">
          Best set {formatSetValue(best.weight, best.reps)}
        </p>
      ) : null}

      <div className="mt-8">
        {isError ? (
          <p className="text-[15px] text-muted-foreground">Couldn&apos;t load this history.</p>
        ) : isPending ? (
          <div className="space-y-px">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse border-b border-border" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-20 pb-2 text-left text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                {Array.from({ length: setCount }, (_, i) => (
                  <th
                    key={i}
                    className="pb-2 text-center text-[11px] font-normal uppercase tracking-wider text-muted-foreground"
                  >
                    Set {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.date}>
                  <td className="border-t border-border py-2 pr-2 text-[13px] text-muted-foreground">
                    {formatSessionDate(entry.date)}
                  </td>
                  {Array.from({ length: setCount }, (_, i) => {
                    const set = entry.sets[i] ?? { weight: null, reps: null };
                    return (
                      <td
                        key={i}
                        className={`border-t border-border py-2 text-center text-[15px] tabular-nums ${
                          set.weight == null ? "text-muted-foreground/40" : ""
                        }`}
                      >
                        {formatSetValue(set.weight, set.reps)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {entries.some((e) => e.note) ? (
        <div className="mt-8 space-y-2">
          <h2 className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
            Notes
          </h2>
          {entries
            .filter((e) => e.note)
            .map((e) => (
              <p key={e.date} className="text-[13px] leading-relaxed text-muted-foreground">
                <span className="text-muted-foreground/50">
                  {formatSessionDate(e.date)} ·{" "}
                </span>
                {e.note}
              </p>
            ))}
        </div>
      ) : null}
    </div>
  );
}
