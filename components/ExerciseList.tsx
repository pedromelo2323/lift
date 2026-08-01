"use client";

import { useState } from "react";
import type { ExerciseWithData } from "@/types";
import {
  addExercise,
  deleteExercise,
  reorderExercise,
  updateExerciseName,
} from "@/lib/actions/workouts";
import { SessionTable } from "@/components/SessionTable";

type ExerciseListProps = {
  workoutId: string;
  exercises: ExerciseWithData[];
};

export function ExerciseList({ workoutId, exercises }: ExerciseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    exercises[0]?.id ?? null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  async function handleRename(exerciseId: string, name: string) {
    await updateExerciseName(exerciseId, workoutId, name);
    setEditingId(null);
  }

  return (
    <div className="space-y-1">
      {exercises.map((exercise, index) => {
        const isExpanded = expandedId === exercise.id;

        return (
          <div key={exercise.id} className="border-b border-[#E5E5EA] last:border-b-0">
            <div className="flex items-center gap-2 py-3">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-expanded={isExpanded}
              >
                <span className="w-4 shrink-0 text-[13px] text-[#86868B]">
                  {isExpanded ? "▼" : "▶"}
                </span>
                {editingId === exercise.id ? (
                  <input
                    value={draftName}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => handleRename(exercise.id, draftName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(exercise.id, draftName);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[17px] font-medium tracking-[-0.02em] text-[#1D1D1F] outline-none"
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate text-[17px] font-medium tracking-[-0.02em] text-[#1D1D1F]"
                    onDoubleClick={() => {
                      setEditingId(exercise.id);
                      setDraftName(exercise.name);
                    }}
                  >
                    {exercise.name}
                  </span>
                )}
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => reorderExercise(exercise.id, workoutId, "up")}
                  className="rounded-md px-2 py-1 text-[12px] text-[#86868B] disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === exercises.length - 1}
                  onClick={() => reorderExercise(exercise.id, workoutId, "down")}
                  className="rounded-md px-2 py-1 text-[12px] text-[#86868B] disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => deleteExercise(exercise.id, workoutId)}
                  className="rounded-md px-2 py-1 text-[12px] text-[#86868B]"
                  aria-label="Delete exercise"
                >
                  ×
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="pb-4 pl-6 pr-1">
                {exercise.sets_reps && (
                  <p className="mb-3 text-[13px] text-[#86868B]">{exercise.sets_reps}</p>
                )}
                <SessionTable exercise={exercise} workoutId={workoutId} />
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => addExercise(workoutId, "New Exercise")}
        className="mt-4 w-full rounded-xl border border-dashed border-[#D1D1D6] px-4 py-3 text-[15px] text-[#86868B] transition-colors duration-200 hover:border-[#86868B] hover:text-[#1D1D1F]"
      >
        Add exercise
      </button>
    </div>
  );
}
