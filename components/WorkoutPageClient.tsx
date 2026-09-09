"use client";

import { useRouter } from "next/navigation";
import { WorkoutView } from "@/components/WorkoutView";
import { WorkoutSkeleton } from "@/components/LoadingSkeleton";
import { SetupNotice } from "@/components/SetupNotice";
import { RestTimer } from "@/components/RestTimer";
import { useWorkoutDetail } from "@/hooks/use-workouts";

type WorkoutPageClientProps = {
  workoutId: string;
};

export function WorkoutPageClient({ workoutId }: WorkoutPageClientProps) {
  const router = useRouter();
  const { data: workout, isPending, isError, refetch } = useWorkoutDetail(workoutId);

  return (
    <>
      {isError ? (
        <div className="px-6 pb-20 pt-10">
          <SetupNotice />
          <p className="mt-10 text-[15px] text-muted-foreground">Couldn&apos;t load this workout.</p>
          <div className="mt-4 flex items-center gap-5">
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-[15px] font-medium text-foreground active:opacity-60"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-[15px] text-muted-foreground"
            >
              Back to workouts
            </button>
          </div>
        </div>
      ) : isPending || !workout ? (
        <div className="px-6 pb-20 pt-10">
          <SetupNotice />
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-10 animate-pulse rounded bg-secondary" />
          </div>
          <div className="mt-6 h-9 w-32 animate-pulse rounded bg-secondary" />
          <WorkoutSkeleton />
        </div>
      ) : (
        <>
          <SetupNotice />
          <WorkoutView workout={workout} />
        </>
      )}
      <RestTimer />
    </>
  );
}
