import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWorkoutDetail, fetchWorkouts, workoutKey, workoutsKey } from "@/lib/api/workouts";

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

export function useInvalidateWorkouts() {
  const queryClient = useQueryClient();

  return (workoutId?: string) => {
    queryClient.invalidateQueries({ queryKey: workoutsKey });
    if (workoutId) {
      queryClient.invalidateQueries({ queryKey: workoutKey(workoutId) });
    }
  };
}
