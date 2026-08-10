"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { WorkoutWithMeta } from "@/types";
import { fetchWorkoutDetail, workoutKey } from "@/lib/api/workouts";
import { formatLastCompleted } from "@/lib/utils/date";

type WorkoutRowProps = {
  workout: WorkoutWithMeta;
};

export function WorkoutRow({ workout }: WorkoutRowProps) {
  const queryClient = useQueryClient();

  function prefetch() {
    queryClient.prefetchQuery({
      queryKey: workoutKey(workout.id),
      queryFn: () => fetchWorkoutDetail(workout.id),
    });
  }

  return (
    <Link
      href={`/workout/${workout.id}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      className="flex items-baseline justify-between border-b border-border py-4 transition-colors duration-200 active:bg-secondary"
    >
      <span className="text-[19px] tracking-tight">{workout.name}</span>
      <span className="text-[13px] tabular-nums text-muted-foreground">
        {formatLastCompleted(workout.last_completed_date)}
      </span>
    </Link>
  );
}
