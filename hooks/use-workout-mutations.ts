import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutKey, workoutsKey } from "@/lib/api/workouts";
import {
  addExercise,
  deleteExercise,
  reorderExercise,
  updateExerciseName,
  updateWorkoutName,
} from "@/lib/workouts/mutations";
import type { WorkoutDetail } from "@/types";
import { getTodayDateString } from "@/lib/utils/date";
import { emptyTodaySessions } from "@/lib/workouts/transform";

export function useWorkoutMutations(workoutId: string) {
  const queryClient = useQueryClient();
  const detailKey = workoutKey(workoutId);

  const renameWorkout = useMutation({
    mutationFn: (name: string) => updateWorkoutName(workoutId, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: workoutsKey });
      const previousDetail = queryClient.getQueryData<WorkoutDetail>(detailKey);
      const previousWorkouts = queryClient.getQueryData<Awaited<ReturnType<typeof import("@/lib/api/workouts").fetchWorkouts>>>(workoutsKey);

      if (previousDetail) {
        queryClient.setQueryData(detailKey, { ...previousDetail, name });
      }
      if (previousWorkouts) {
        queryClient.setQueryData(
          workoutsKey,
          previousWorkouts.map((w) => (w.id === workoutId ? { ...w, name } : w)),
        );
      }

      return { previousDetail, previousWorkouts };
    },
    onError: (_err, _name, context) => {
      if (context?.previousDetail) queryClient.setQueryData(detailKey, context.previousDetail);
      if (context?.previousWorkouts) queryClient.setQueryData(workoutsKey, context.previousWorkouts);
    },
  });

  const renameExercise = useMutation({
    mutationFn: ({ exerciseId, name }: { exerciseId: string; name: string }) =>
      updateExerciseName(exerciseId, name),
    onMutate: async ({ exerciseId, name }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkoutDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData(detailKey, {
          ...previous,
          exercises: previous.exercises.map((e) =>
            e.id === exerciseId ? { ...e, name } : e,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
  });

  const createExercise = useMutation({
    mutationFn: (name: string) => addExercise(workoutId, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkoutDetail>(detailKey);
      const tempId = `temp-${crypto.randomUUID()}`;
      const today = getTodayDateString();

      if (previous) {
        queryClient.setQueryData(detailKey, {
          ...previous,
          exercises: [
            ...previous.exercises,
            {
              id: tempId,
              workout_id: workoutId,
              name,
              sets_reps: null,
              sort_order: previous.exercises.length + 1,
              created_at: new Date().toISOString(),
              note: null,
              sessions: emptyTodaySessions(tempId, today),
            },
          ],
        });
      }

      return { previous, tempId };
    },
    onSuccess: (created, _name, context) => {
      queryClient.setQueryData<WorkoutDetail>(detailKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          exercises: current.exercises.map((e) =>
            e.id === context?.tempId ? created : e,
          ),
        };
      });
    },
    onError: (_err, _name, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
  });

  const removeExercise = useMutation({
    mutationFn: (exerciseId: string) => deleteExercise(exerciseId),
    onMutate: async (exerciseId) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkoutDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData(detailKey, {
          ...previous,
          exercises: previous.exercises.filter((e) => e.id !== exerciseId),
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
  });

  const moveExercise = useMutation({
    mutationFn: ({
      exerciseId,
      direction,
    }: {
      exerciseId: string;
      direction: "up" | "down";
    }) => reorderExercise(workoutId, exerciseId, direction),
    onMutate: async ({ exerciseId, direction }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkoutDetail>(detailKey);
      if (!previous) return { previous };

      const index = previous.exercises.findIndex((e) => e.id === exerciseId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapIndex < 0 || swapIndex >= previous.exercises.length) {
        return { previous };
      }

      const next = [...previous.exercises];
      [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
      queryClient.setQueryData(detailKey, { ...previous, exercises: next });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
  });

  return {
    renameWorkout,
    renameExercise,
    createExercise,
    removeExercise,
    moveExercise,
  };
}
