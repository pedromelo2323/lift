"use client";

import { useEffect } from "react";
import { AppSplash } from "@/components/AppSplash";
import { WorkoutRow } from "@/components/WorkoutRow";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { SetupNotice } from "@/components/SetupNotice";
import { usePrefetchWorkouts, useWorkouts } from "@/hooks/use-workouts";

export function HomeView() {
  const { data: workouts, isPending, isError } = useWorkouts();
  const prefetchWorkouts = usePrefetchWorkouts();

  useEffect(() => {
    if (workouts?.length) {
      prefetchWorkouts(workouts.map((w) => w.id));
    }
  }, [workouts, prefetchWorkouts]);

  const showSplash = isPending && !workouts;

  return (
    <>
      <AppSplash isLoading={showSplash} />
      <div className="px-6 pb-16 pt-16">
        <SetupNotice />

        <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Hey Pedro</h1>
        <p className="mt-1 text-[17px] text-muted-foreground">What are we training today?</p>

        {isError ? (
          <p className="mt-10 text-[15px] text-muted-foreground">Couldn&apos;t load your workouts.</p>
        ) : showSplash ? null : isPending ? (
          <ListSkeleton />
        ) : (
          <div className="mt-10">
            {workouts?.map((workout) => (
              <WorkoutRow key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
