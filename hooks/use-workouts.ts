import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exerciseHistoryKey,
  fetchExerciseHistory,
  fetchWorkoutDetail,
  fetchWorkouts,
  workoutKey,
  workoutsKey,
} from "@/lib/api/workouts";
import type { WorkoutDetail } from "@/types";

export function useWorkouts() {
  return useQuery({
    queryKey: workoutsKey,
    queryFn: fetchWorkouts,
  });
}

export function useWorkoutDetail(workoutId: string) {
  return useQuery({
    queryKey: workoutKey(workoutId),
    queryFn: () => fetchWorkoutDetail(workoutId),
    enabled: Boolean(workoutId),
    placeholderData: (previous) => previous,
  });
}

export function useExerciseHistory(exerciseId: string) {
  return useQuery({
    queryKey: exerciseHistoryKey(exerciseId),
    queryFn: () => fetchExerciseHistory(exerciseId),
    enabled: Boolean(exerciseId),
  });
}

export function usePrefetchWorkouts() {
  const queryClient = useQueryClient();

  return (workoutIds: string[]) => {
    for (const id of workoutIds) {
      queryClient.prefetchQuery({
        queryKey: workoutKey(id),
        queryFn: () => fetchWorkoutDetail(id),
      });
    }
  };
}

export function usePatchWorkoutDetail(workoutId: string) {
  const queryClient = useQueryClient();
  const detailKey = workoutKey(workoutId);

  return (updater: (current: WorkoutDetail) => WorkoutDetail) => {
    queryClient.setQueryData<WorkoutDetail>(detailKey, (current) =>
      current ? updater(current) : current,
    );
  };
}
