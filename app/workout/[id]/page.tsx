import { notFound } from "next/navigation";
import { ExerciseList } from "@/components/ExerciseList";
import { SetupNotice } from "@/components/SetupNotice";
import { WorkoutHeader } from "@/components/WorkoutHeader";
import { getWorkoutDetail } from "@/lib/db/workouts";

type WorkoutPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { id } = await params;
  const workout = await getWorkoutDetail(id);

  if (!workout) {
    notFound();
  }

  return (
    <div>
      <SetupNotice />
      <WorkoutHeader workoutId={workout.id} name={workout.name} />
      <ExerciseList workoutId={workout.id} exercises={workout.exercises} />
    </div>
  );
}
