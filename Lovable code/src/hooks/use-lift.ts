import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addExercise,
  deleteExercise,
  ensureTodaySession,
  fetchExerciseHistory,
  fetchWorkoutDetail,
  fetchWorkouts,
  reorderExercises,
  setTodaySkipped,
  updateExercise,
  upsertSessionNote,
  upsertSet,
} from "@/lib/lift/api";

export const workoutsKey = ["workouts"] as const;
export const workoutKey = (id: string) => ["workout", id] as const;
export const exerciseHistoryKey = (id: string) => ["exercise-history", id] as const;

export function useWorkouts() {
  return useQuery({ queryKey: workoutsKey, queryFn: fetchWorkouts });
}

export function useWorkoutDetail(workoutId: string) {
  return useQuery({
    queryKey: workoutKey(workoutId),
    queryFn: () => fetchWorkoutDetail(workoutId),
  });
}

export function useExerciseHistory(exerciseId: string) {
  return useQuery({
    queryKey: exerciseHistoryKey(exerciseId),
    queryFn: () => fetchExerciseHistory(exerciseId),
  });
}

export function useWorkoutMutations(workoutId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: workoutKey(workoutId) });
    queryClient.invalidateQueries({ queryKey: workoutsKey });
  };

  const saveSet = useMutation({
    mutationFn: async (input: {
      exerciseId: string;
      setIndex: number;
      weight: number | null;
      reps: number | null;
    }) => {
      const session = await ensureTodaySession(workoutId);
      await upsertSet({
        sessionId: session.id,
        exerciseId: input.exerciseId,
        setIndex: input.setIndex,
        weight: input.weight,
        reps: input.reps,
      });
    },
    onSuccess: invalidate,
  });

  const renameExercise = useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      updateExercise(input.id, { name: input.name }),
    onSuccess: invalidate,
  });

  const saveNote = useMutation({
    mutationFn: async (input: { id: string; note: string | null }) => {
      const session = await ensureTodaySession(workoutId);
      await upsertSessionNote({
        sessionId: session.id,
        exerciseId: input.id,
        body: input.note,
      });
    },
    onSuccess: invalidate,
  });

  const skipToday = useMutation({
    mutationFn: (skipped: boolean) => setTodaySkipped(workoutId, skipped),
    onSuccess: invalidate,
  });

  const createExercise = useMutation({
    mutationFn: (input: { name: string; position: number }) =>
      addExercise(workoutId, input.name, input.position),
    onSuccess: invalidate,
  });

  const removeExercise = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (ordered: { id: string; position: number; linked_to_next: boolean }[]) => reorderExercises(ordered),
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: workoutKey(workoutId) });
      queryClient.setQueryData(workoutKey(workoutId), (old: any) => {
        if (!old) return old;
        const map = new Map(ordered.map((o) => [o.id, o]));
        const exercises = old.exercises
          .map((e: any) => ({ ...e, ...(map.get(e.id) ?? {}) }))
          .sort((a: any, b: any) => a.position - b.position);
        return { ...old, exercises };
      });
    },
    onSettled: invalidate,
  });

  return {
    saveSet,
    renameExercise,
    saveNote,
    skipToday,
    createExercise,
    removeExercise,
    reorder,
  };
}
