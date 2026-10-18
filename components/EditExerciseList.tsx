"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ExerciseWithData } from "@/types";
import { useWorkoutMutations } from "@/hooks/use-workout-mutations";
import { moveExercise, removeExercise, toggleSuperset } from "@/lib/utils/superset";
import { normalizeSetsReps } from "@/lib/utils/workout";

type EditExerciseListProps = {
  workoutId: string;
  exercises: ExerciseWithData[];
};

export function EditExerciseList({ workoutId, exercises }: EditExerciseListProps) {
  const { renameExercise, setExerciseSetsReps, createExercise, removeExercise: deleteExercise, arrangeExercises } =
    useWorkoutMutations(workoutId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = exercises.findIndex((e) => e.id === active.id);
    const to = exercises.findIndex((e) => e.id === over.id);
    if (from === -1 || to === -1) return;
    arrangeExercises.mutate(moveExercise(exercises, from, to));
  }

  function remove(index: number) {
    const exercise = exercises[index]!;
    // Keep the superset above it intact when removing the end of a pair.
    if (index > 0 && exercises[index - 1]!.linked_to_next && !exercise.linked_to_next) {
      arrangeExercises.mutate(removeExercise(exercises, index));
    }
    deleteExercise.mutate(exercise.id);
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-muted-foreground">
        Hold the handle to drag. Tap Pair between two exercises to make a superset.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {exercises.map((exercise, index) => (
            <div key={exercise.id}>
              <SortableExercise
                exercise={exercise}
                paired={exercise.linked_to_next || Boolean(exercises[index - 1]?.linked_to_next)}
                onRename={(name) => renameExercise.mutate({ exerciseId: exercise.id, name })}
                onSetsReps={(setsReps) => setExerciseSetsReps.mutate({ exerciseId: exercise.id, setsReps })}
                onDelete={() => remove(index)}
              />
              {index < exercises.length - 1 ? (
                <PairToggle
                  linked={exercise.linked_to_next}
                  onToggle={() => arrangeExercises.mutate(toggleSuperset(exercises, index))}
                />
              ) : null}
            </div>
          ))}
        </SortableContext>
      </DndContext>
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

function PairToggle({ linked, onToggle }: { linked: boolean; onToggle: () => void }) {
  return (
    <div className="relative flex h-9 items-center justify-center">
      {linked ? <span aria-hidden="true" className="absolute inset-y-0 left-[19px] w-px bg-foreground/50" /> : null}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={linked}
        aria-label={linked ? "Split superset" : "Pair as superset"}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] transition-colors duration-150 ${
          linked ? "border-foreground bg-foreground text-background" : "border-dashed border-border text-muted-foreground"
        }`}
      >
        <LinkIcon broken={!linked} />
        {linked ? "Superset" : "Pair"}
      </button>
    </div>
  );
}

function SortableExercise({
  exercise,
  paired,
  onRename,
  onSetsReps,
  onDelete,
}: {
  exercise: ExerciseWithData;
  paired: boolean;
  onRename: (name: string) => void;
  onSetsReps: (setsReps: string | null) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });
  const [name, setName] = useState(exercise.name);
  const [setsReps, setSetsReps] = useState(exercise.sets_reps ?? "");

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed) setName(exercise.name);
    else if (trimmed !== exercise.name) onRename(trimmed);
  }

  function saveSetsReps() {
    const next = normalizeSetsReps(setsReps);
    setSetsReps(next ?? "");
    if (next !== (exercise.sets_reps ?? null)) onSetsReps(next);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-1 rounded-xl border bg-background py-2 pl-1 pr-2 ${
        paired ? "border-foreground/40" : "border-border"
      } ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag ${exercise.name}`}
        className="touch-none cursor-grab self-stretch px-2 text-muted-foreground active:cursor-grabbing"
      >
        <GripIcon />
      </button>
      <div className="min-w-0 flex-1">
        <input
          value={name}
          aria-label="Exercise name"
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="w-full bg-transparent text-[16px] outline-none"
        />
        <input
          value={setsReps}
          aria-label="Sets × reps"
          placeholder="Sets × reps, e.g. 3×10"
          maxLength={20}
          onChange={(e) => setSetsReps(e.target.value)}
          onBlur={saveSetsReps}
          className="mt-0.5 w-full bg-transparent text-[13px] tabular-nums text-muted-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>
      <button type="button" onClick={onDelete} className="px-2 text-[13px] text-destructive">
        Delete
      </button>
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function LinkIcon({ broken }: { broken: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {broken ? (
        <>
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 0 1 4 8" />
          <path d="M8 12h3" />
        </>
      ) : (
        <>
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
          <path d="M8 12h8" />
        </>
      )}
    </svg>
  );
}
