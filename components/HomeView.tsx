"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSplash } from "@/components/AppSplash";
import { InstallHint } from "@/components/InstallHint";
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
  const router = useRouter();

  useEffect(() => {
    if (workouts?.length) {
      prefetchWorkouts(workouts.map((w) => w.id));
    }
  }, [workouts, prefetchWorkouts]);

  // New accounts start with no workouts: send them to build a plan.
  useEffect(() => {
    if (!isPending && !isError && workouts?.length === 0) router.replace("/onboarding");
  }, [isPending, isError, workouts, router]);

  const showSplash = isPending && !workouts;

  return (
    <>
      <AppSplash isLoading={showSplash} />
      <div className="relative px-6 pb-16 pt-16">
        <Link
          href="/settings"
          aria-label="Settings"
          className="absolute right-4 top-5 p-2 text-muted-foreground transition-opacity active:opacity-60"
        >
          <SettingsIcon />
        </Link>
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
            <InstallHint />
          </div>
        )}
      </div>
    </>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}
