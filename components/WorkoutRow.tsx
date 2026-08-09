import Link from "next/link";
import type { WorkoutWithMeta } from "@/types";
import { formatLastCompleted } from "@/lib/utils/date";

type WorkoutRowProps = {
  workout: WorkoutWithMeta;
};

export function WorkoutRow({ workout }: WorkoutRowProps) {
  return (
    <Link
      href={`/workout/${workout.id}`}
      className="flex items-baseline justify-between border-b border-border py-4 transition-colors duration-200 active:bg-secondary"
    >
      <span className="text-[19px] tracking-tight">{workout.name}</span>
      <span className="text-[13px] tabular-nums text-muted-foreground">
        {formatLastCompleted(workout.last_completed_date)}
      </span>
    </Link>
  );
}
