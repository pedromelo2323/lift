import { ExerciseHistoryClient } from "@/components/ExerciseHistoryClient";

type ExercisePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { id } = await params;
  return <ExerciseHistoryClient exerciseId={id} />;
}
