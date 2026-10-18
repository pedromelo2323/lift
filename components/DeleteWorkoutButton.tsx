"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { workoutKey, workoutsKey } from "@/lib/api/workouts";
import { deleteWorkout } from "@/lib/workouts/mutations";
import type { WorkoutWithMeta } from "@/types";

/** Two taps to delete: the first asks, the second deletes the workout and its history. */
export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    setBusy(true);
    setError(false);
    try {
      await deleteWorkout(workoutId);
      queryClient.setQueryData<WorkoutWithMeta[]>(workoutsKey, (all) => all?.filter((w) => w.id !== workoutId));
      queryClient.removeQueries({ queryKey: workoutKey(workoutId) });
      router.replace("/");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="mt-12">
      {confirming ? (
        <div className="flex items-center gap-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="text-[15px] font-medium text-destructive disabled:opacity-40"
          >
            {busy ? "Deleting…" : "Delete workout and its history"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-[15px] text-muted-foreground">
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-[15px] text-destructive">
          Delete workout
        </button>
      )}
      {error ? <p className="mt-2 text-[13px] text-destructive">Couldn&apos;t delete. Try again.</p> : null}
    </div>
  );
}
