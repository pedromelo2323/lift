import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutKey, workoutsKey } from "@/lib/api/workouts";
import {
  addExercise,
  deleteExercise,
  saveExerciseLayout,
  type ExerciseLayout,
  updateExerciseName,
  updateExerciseSetsReps,
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

  const setExerciseSetsReps = useMutation({
    mutationFn: ({ exerciseId, setsReps }: { exerciseId: string; setsReps: string | null }) =>
      updateExerciseSetsReps(exerciseId, setsReps),
    onMutate: async ({ exerciseId, setsReps }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkoutDetail>(detailKey);
      if (previous) {
        queryClient.setQueryData(detailKey, {
          ...previous,
          exercises: previous.exercises.map((e) =>
            e.id === exerciseId ? { ...e, sets_reps: setsReps } : e,
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
              linked_to_next: false,
              created_at: new Date().toISOString(),
              note: null,
              sessions: emptyTodaySessions(tempId, today),
              all_time_best: null,
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

  // Serialized so an older layout can never land after a newer one.
  const arrangeExercises = useMutation({
    scope: { id: `exercise-layout-${workoutId}` },
    mutationFn: (layout: ExerciseLayout) => saveExerciseLayout(layout),
    onMutate: async (layout) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorkoutDetail>(detailKey);
      if (previous) {
        const byId = new Map(previous.exercises.map((e) => [e.id, e]));
        const exercises = layout.flatMap((item, index) => {
          const exercise = byId.get(item.id);
          return exercise ? [{ ...exercise, sort_order: index + 1, linked_to_next: item.linked_to_next }] : [];
        });
        queryClient.setQueryData<WorkoutDetail>(detailKey, { ...previous, exercises });
      }
      return { previous };
    },
    onError: (_err, _layout, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
      void queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });

  return {
    renameWorkout,
    renameExercise,
    setExerciseSetsReps,
    createExercise,
    removeExercise,
    arrangeExercises,
  };
}
