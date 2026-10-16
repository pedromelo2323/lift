import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { useWorkouts } from "@/hooks/use-lift";
import { formatDay } from "@/lib/lift/model";
import { fetchProfile } from "@/lib/lift/account";
import { WeeklyRecap } from "@/components/lift/weekly-recap";
import { InstallPrompt } from "@/components/lift/install-prompt";
import { FirstHint, dismissHint } from "@/components/lift/first-hint";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your workouts — Lift" },
      {
        name: "description",
        content: "Open today's workout, see your last sessions, edit today's weights and reps.",
      },
      { property: "og:title", content: "Your workouts — Lift" },
      {
        property: "og:description",
        content: "Open today's workout and pick up exactly where you left off.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { data: workouts, isPending, isError, isFetching } = useWorkouts();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  useEffect(() => {
    if (!isPending && !isFetching && !isError && workouts && workouts.length === 0) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [isPending, isFetching, isError, workouts, navigate]);

  const rawFirst = (profile?.display_name ?? "").trim().split(/[\s._\-@+]+/)[0] ?? "";
  const firstName = rawFirst.replace(/\d+/g, "")
    ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1)
    : "";

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-16 pt-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight">
            {firstName ? `Hey ${firstName}` : "Hey"}
          </h1>
          <p className="mt-1 text-[17px] text-muted-foreground">
            What are we training today?
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="-mr-1 p-1 text-muted-foreground/50"
        >
          <Settings aria-hidden className="size-5" />
        </Link>
      </div>

      <WeeklyRecap />
      <InstallPrompt />

      {workouts && workouts.length > 0 ? (
        <FirstHint id="home-open" className="mt-8">
          Tap a workout to start. Your last sessions are waiting inside.
        </FirstHint>
      ) : null}

      <div className="mt-10">
        {isError ? (
          <p className="text-[15px] text-muted-foreground">Couldn't load your workouts.</p>
        ) : isPending ? (
          <div className="space-y-px">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[68px] animate-pulse border-b border-border" />
            ))}
          </div>
        ) : (
          workouts.map((workout) => (
            <Link
              key={workout.id}
              to="/workout/$workoutId"
              params={{ workoutId: workout.id }}
              onClick={() => dismissHint("home-open")}
              className="flex items-baseline justify-between border-b border-border py-4 transition-colors duration-200 active:bg-secondary"
            >
              <span className="text-[19px] tracking-tight">{workout.name}</span>
              <span className="text-[13px] text-muted-foreground">
                {workout.last_completed_at ? formatDay(workout.last_completed_at) : "—"}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
