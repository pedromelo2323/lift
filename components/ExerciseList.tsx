"use client";

import { useState } from "react";
import type { ExerciseWithData } from "@/types";
import { formatRepRange } from "@/lib/utils/workout";
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
  const { renameExercise, createExercise, removeExercise, moveExercise } =
    useWorkoutMutations(workoutId);
  const [expandedId, setExpandedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(exercises.map((e) => [e.id, e.name])),
  );

  function handleRename(exerciseId: string, name: string) {
    const trimmed = name.trim();
    const current = exercises.find((e) => e.id === exerciseId)?.name;
    if (trimmed && trimmed !== current) {
      renameExercise.mutate({ exerciseId, name: trimmed });
    }
  }

  if (isEditing) {
    return (
      <div>
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="flex items-center gap-2 border-b border-border py-3">
            <input
              value={names[exercise.id] ?? exercise.name}
              onChange={(e) =>
                setNames((current) => ({ ...current, [exercise.id]: e.target.value }))
              }
              onBlur={() => handleRename(exercise.id, names[exercise.id] ?? exercise.name)}
              className="min-w-0 flex-1 bg-transparent text-[17px] outline-none"
            />
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
      {exercises.map((exercise) => {
        const isExpanded = expandedId === exercise.id;
        const repRange = formatRepRange(exercise.sets_reps);

        return (
          <div key={exercise.id} className="border-b border-border">
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
              <SessionTable exercise={exercise} />
            )}
          </div>
        );
      })}
    </div>
  );
}
