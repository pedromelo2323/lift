import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { WorkoutView } from "@/components/WorkoutView";
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
    <>
      <SetupNotice />
      <WorkoutView workout={workout} />
    </>
  );
}
