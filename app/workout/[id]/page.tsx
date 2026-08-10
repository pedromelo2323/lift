import { WorkoutPageClient } from "@/components/WorkoutPageClient";

type WorkoutPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { id } = await params;
  return <WorkoutPageClient workoutId={id} />;
}
