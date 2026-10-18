"use client";

import { useState } from "react";
import type { ExerciseWithData } from "@/types";
import { formatRepRange } from "@/lib/utils/workout";
import { EditExerciseList } from "@/components/EditExerciseList";
import { SessionTable } from "@/components/SessionTable";

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
  const [expandedId, setExpandedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );

  if (isEditing) return <EditExerciseList workoutId={workoutId} exercises={exercises} />;

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
