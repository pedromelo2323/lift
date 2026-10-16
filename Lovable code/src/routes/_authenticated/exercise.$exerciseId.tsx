import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useExerciseHistory } from "@/hooks/use-lift";
import { formatDay, formatValue, isBetter, strengthScore } from "@/lib/lift/model";
import { usePrefs } from "@/lib/lift/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/exercise/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Exercise history — Lift" },
      {
        name: "description",
        content: "Every session you've logged for this exercise, oldest to newest.",
      },
      { property: "og:title", content: "Exercise history — Lift" },
      {
        property: "og:description",
        content: "Every session you've logged for this exercise, oldest to newest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExerciseHistoryPage,
});

function ExerciseHistoryPage() {
  const { exerciseId } = Route.useParams();
  const router = useRouter();
  const { data, isPending, isError } = useExerciseHistory(exerciseId);
  usePrefs();

  const entries = data?.entries ?? [];
  const setCount = entries.reduce((acc, e) => Math.max(acc, e.values.length), 0) || 3;

  const best = entries
    .flatMap((e) => (e.skipped ? [] : e.values))
    .reduce<{ weight: number | null; reps: number | null } | null>(
      (acc, v) => (acc == null || isBetter(v, acc) ? v : acc),
      null,
    );

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-20 pt-10">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Back
      </button>

      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">
        {data?.exercise.name ?? " "}
      </h1>
      {best && best.weight != null ? (
        <p className="mt-1 text-[15px] text-muted-foreground">
          Best set {formatValue(best)}
        </p>
      ) : null}

      <ProgressLine
        points={entries
          .filter((e) => !e.skipped)
          .map((e) => strengthScore(e.values))
          .filter((n): n is number => n != null)}
      />

      <div className="mt-8">
        {isError ? (
          <p className="text-[15px] text-muted-foreground">Couldn't load this history.</p>
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
                    {formatDay(entry.date)}
                  </td>
                  {entry.skipped ? (
                    <td
                      colSpan={setCount}
                      className="border-t border-border py-2 text-center text-[13px] italic text-muted-foreground/60"
                    >
                      Skipped
                    </td>
                  ) : (
                    Array.from({ length: setCount }, (_, i) => (
                      <td
                        key={i}
                        className={cn(
                          "border-t border-border py-2 text-center text-[15px] tabular-nums",
                          entry.values[i]?.weight == null && "text-muted-foreground/40",
                        )}
                      >
                        {formatValue(entry.values[i] ?? { weight: null, reps: null })}
                      </td>
                    ))
                  )}
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
                <span className="text-muted-foreground/50">{formatDay(e.date)} · </span>
                {e.note}
              </p>
            ))}
        </div>
      ) : null}

    </main>
  );
}

function ProgressLine({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 320;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const xy = points.map((p, i) => [
    (i / (points.length - 1)) * w,
    h - 4 - ((p - min) / span) * (h - 8),
  ]);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x!.toFixed(1)},${y!.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1]!;
  const change = Math.round(((points[points.length - 1]! - points[0]!) / points[0]!) * 100);
  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full overflow-visible" aria-hidden>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.25} className="text-foreground/70" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0]} cy={last[1]} r={2.5} className="fill-foreground" />
      </svg>
      <p className="mt-1 text-[12px] text-muted-foreground/70">
        {change > 0 ? `+${change}% stronger since your first session` : change < 0 ? `${change}% since your first session` : "Holding steady since your first session"}
      </p>
    </div>
  );
}
