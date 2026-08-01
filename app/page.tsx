import { WorkoutCard } from "@/components/WorkoutCard";
import { SetupNotice } from "@/components/SetupNotice";
import { getWorkouts } from "@/lib/db/workouts";

export default async function HomePage() {
  const workouts = await getWorkouts();

  return (
    <div>
      <SetupNotice />

      <header className="mb-10 pt-2">
        <p className="text-[15px] text-[#86868B]">Hey Pedro</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-[#1D1D1F]">
          What are we training today?
        </h1>
      </header>

      {workouts.length > 0 ? (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#86868B]">
          No workouts yet. Connect Supabase to load your Push3, Pull3, and Legs3 templates.
        </p>
      )}
    </div>
  );
}
