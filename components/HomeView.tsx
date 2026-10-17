"use client";

import { useEffect } from "react";
import { AppSplash } from "@/components/AppSplash";
import { WorkoutRow } from "@/components/WorkoutRow";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { SetupNotice } from "@/components/SetupNotice";
import { useProfile, usePrefetchWorkouts, useWorkouts } from "@/hooks/use-workouts";
import { firstName } from "@/lib/api/profile";

export function HomeView() {
  const { data: workouts, isPending, isError, refetch } = useWorkouts();
  const { data: profile } = useProfile();
  const name = firstName(profile?.displayName);
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

        <h1 className="text-[32px] font-semibold leading-tight tracking-tight">
          {name ? `Hey ${name}` : "Hey"}
        </h1>
        <p className="mt-1 text-[17px] text-muted-foreground">What are we training today?</p>

        {isError ? (
          <div className="mt-10">
            <p className="text-[15px] text-muted-foreground">Couldn&apos;t load your workouts.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-[15px] font-medium text-foreground active:opacity-60"
            >
              Try again
            </button>
          </div>
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
