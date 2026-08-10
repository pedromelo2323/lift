"use client";

import { useState } from "react";
import Link from "next/link";
import { updateWorkoutName } from "@/lib/actions/workouts";
import { useInvalidateWorkouts } from "@/hooks/use-workouts";

type WorkoutHeaderProps = {
  workoutId: string;
  name: string;
  isEditing: boolean;
  onToggleEdit: () => void;
};

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WorkoutHeader({ workoutId, name, isEditing, onToggleEdit }: WorkoutHeaderProps) {
  const invalidate = useInvalidateWorkouts();
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState(name);

  async function save(nextName: string) {
    await updateWorkoutName(workoutId, nextName.trim() || name);
    invalidate(workoutId);
    setEditingTitle(false);
  }

  return (
    <header>
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground transition-opacity duration-200 active:opacity-60"
        >
          <ChevronLeft />
          Workouts
        </Link>
        <button
          type="button"
          onClick={onToggleEdit}
          className="text-[15px] text-muted-foreground transition-opacity duration-200 active:opacity-60"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {editingTitle ? (
        <input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => save(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save(draft);
            if (e.key === "Escape") {
              setDraft(name);
              setEditingTitle(false);
            }
          }}
          className="mt-6 w-full bg-transparent text-[28px] font-semibold leading-tight tracking-tight outline-none"
        />
      ) : (
        <h1
          className="mt-6 text-[28px] font-semibold leading-tight tracking-tight"
          onDoubleClick={() => {
            if (isEditing) {
              setDraft(name);
              setEditingTitle(true);
            }
          }}
        >
          {name}
        </h1>
      )}
    </header>
  );
}
