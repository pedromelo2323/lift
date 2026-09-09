"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkoutMutations } from "@/hooks/use-workout-mutations";
import { useSaveStatus } from "@/components/SaveStatus";

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
  const { renameWorkout } = useWorkoutMutations(workoutId);
  const saveStatus = useSaveStatus();
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState(name);

  function save(nextName: string) {
    const trimmed = nextName.trim() || name;
    if (trimmed !== name) {
      void saveStatus.track(() => renameWorkout.mutateAsync(trimmed)).catch(() => {
        // The header exposes the retry action.
      });
    }
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
        <div className="flex items-center gap-3">
          <SaveStateLabel />
          <button
            type="button"
            onClick={onToggleEdit}
            className="text-[15px] text-muted-foreground transition-opacity duration-200 active:opacity-60"
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
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

function SaveStateLabel() {
  const { state, retry } = useSaveStatus();

  if (state === "idle") return null;
  if (state === "error") {
    return (
      <button
        type="button"
        onClick={retry}
        className="text-[12px] text-destructive transition-opacity active:opacity-60"
      >
        Not saved · Retry
      </button>
    );
  }

  return (
    <span
      className={`save-state-label text-[12px] text-muted-foreground/70 ${
        state === "saved" ? "save-state-saved" : ""
      }`}
      aria-live="polite"
    >
      {state === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}
