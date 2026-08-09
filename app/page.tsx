import { WorkoutRow } from "@/components/WorkoutRow";
import { SetupNotice } from "@/components/SetupNotice";
import { getWorkouts } from "@/lib/db/workouts";

export default async function HomePage() {
  const workouts = await getWorkouts();

  return (
    <div className="px-6 pb-16 pt-16">
      <SetupNotice />

      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Hey Pedro</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">What are we training today?</p>

      {workouts.length > 0 ? (
        <div className="mt-10">
          {workouts.map((workout) => (
            <WorkoutRow key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-[15px] text-muted-foreground">
          No workouts yet. Connect Supabase to load your templates.
        </p>
      )}
    </div>
  );
}
