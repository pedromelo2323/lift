"use client";

import { useState } from "react";
import type { ExerciseWithData } from "@/types";
import { formatRepRange, normalizeSetsReps } from "@/lib/utils/workout";
import { SessionTable } from "@/components/SessionTable";
import { useWorkoutMutations } from "@/hooks/use-workout-mutations";

type ExerciseListProps = {
  workoutId: string;
  exercises: ExerciseWithData[];
  isEditing: boolean;
};

function ChevronRight({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`size-3.5 shrink-0 translate-y-0.5 text-muted-foreground/60 transition-transform duration-200 ${
        expanded ? "rotate-90" : ""
      }`}
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExerciseList({ workoutId, exercises, isEditing }: ExerciseListProps) {
  const { renameExercise, setExerciseSetsReps, createExercise, removeExercise, moveExercise } =
    useWorkoutMutations(workoutId);
  const [expandedId, setExpandedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(exercises.map((e) => [e.id, e.name])),
  );
  const [setsReps, setSetsReps] = useState<Record<string, string>>({});

  function handleRename(exerciseId: string, name: string) {
    const trimmed = name.trim();
    const current = exercises.find((e) => e.id === exerciseId)?.name;
    if (trimmed && trimmed !== current) {
      renameExercise.mutate({ exerciseId, name: trimmed });
    }
  }

  function handleSetsReps(exerciseId: string, value: string) {
    const next = normalizeSetsReps(value);
    const current = exercises.find((e) => e.id === exerciseId)?.sets_reps ?? null;
    setSetsReps((all) => ({ ...all, [exerciseId]: next ?? "" }));
    if (next !== current) setExerciseSetsReps.mutate({ exerciseId, setsReps: next });
  }

  if (isEditing) {
    return (
      <div>
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="flex items-center gap-2 border-b border-border py-3">
            <div className="min-w-0 flex-1">
              <input
                value={names[exercise.id] ?? exercise.name}
                aria-label="Exercise name"
                onChange={(e) =>
                  setNames((current) => ({ ...current, [exercise.id]: e.target.value }))
                }
                onBlur={() => handleRename(exercise.id, names[exercise.id] ?? exercise.name)}
                className="w-full bg-transparent text-[17px] outline-none"
              />
              <input
                value={setsReps[exercise.id] ?? exercise.sets_reps ?? ""}
                aria-label="Sets × reps"
                placeholder="Sets × reps, e.g. 3×10"
                maxLength={20}
                onChange={(e) =>
                  setSetsReps((current) => ({ ...current, [exercise.id]: e.target.value }))
                }
                onBlur={(e) => handleSetsReps(exercise.id, e.target.value)}
                className="mt-0.5 w-full bg-transparent text-[13px] tabular-nums text-muted-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              type="button"
              onClick={() => moveExercise.mutate({ exerciseId: exercise.id, direction: "up" })}
              disabled={index === 0}
              className="px-2 text-[13px] text-muted-foreground disabled:opacity-30"
            >
              Up
            </button>
            <button
              type="button"
              onClick={() => moveExercise.mutate({ exerciseId: exercise.id, direction: "down" })}
              disabled={index === exercises.length - 1}
              className="px-2 text-[13px] text-muted-foreground disabled:opacity-30"
            >
              Down
            </button>
            <button
              type="button"
              onClick={() => removeExercise.mutate(exercise.id)}
              className="px-2 text-[13px] text-destructive"
            >
              Delete
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => createExercise.mutate("New exercise")}
          className="mt-5 text-[15px] text-muted-foreground"
        >
          Add exercise
        </button>
      </div>
    );
  }

  return (
    <div>
      {exercises.map((exercise, index) => {
        const isExpanded = expandedId === exercise.id;
        const repRange = formatRepRange(exercise.sets_reps);
        const pairedWithPrevious = Boolean(exercises[index - 1]?.linked_to_next);
        const inSuperset = exercise.linked_to_next || pairedWithPrevious;

        return (
          <div key={exercise.id} className="relative border-b border-border">
            {inSuperset ? (
              <span
                aria-hidden="true"
                className={`absolute -left-3 w-px bg-foreground/40 ${pairedWithPrevious ? "top-0" : "top-4"} ${
                  exercise.linked_to_next ? "bottom-0" : "bottom-4"
                }`}
              />
            ) : null}
            {inSuperset && !pairedWithPrevious ? (
              <p className="pt-3 text-[11px] uppercase tracking-wider text-muted-foreground">Superset</p>
            ) : null}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
              className="flex w-full items-baseline gap-2 py-3.5 text-left"
              aria-expanded={isExpanded}
            >
              <ChevronRight expanded={isExpanded} />
              <span className="flex-1 text-[17px] leading-snug">{exercise.name}</span>
              {repRange ? (
                <span className="text-[13px] tabular-nums text-muted-foreground/70">
                  {repRange}
                </span>
              ) : null}
            </button>

            {isExpanded && (
              <div className="exercise-panel-in">
                <SessionTable exercise={exercise} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
