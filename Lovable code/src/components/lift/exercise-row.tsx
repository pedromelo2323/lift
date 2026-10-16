import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Exercise, WorkoutDetail } from "@/lib/lift/types";
import { ComparisonTable } from "./comparison-table";
import { cn } from "@/lib/utils";

type Props = {
  exercise: Exercise;
  detail: WorkoutDetail;
  expanded: boolean;
  editing: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onSaveSet: (setIndex: number, weight: number | null, reps: number | null) => void;
  onSaveNote: (note: string | null) => void;
};

export function ExerciseRow({
  exercise,
  detail,
  expanded,
  editing,
  onToggle,
  onRename,
  onDelete,
  onMove,
  onSaveSet,
  onSaveNote,
}: Props) {
  const [name, setName] = useState(exercise.name);

  if (editing) {
    return (
      <div className="flex items-center gap-2 border-b border-border py-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== exercise.name && onRename(name.trim())}
          className="min-w-0 flex-1 bg-transparent text-[17px] outline-none"
        />
        <button
          type="button"
          onClick={() => onMove(-1)}
          className="px-2 text-[13px] text-muted-foreground"
        >
          Up
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          className="px-2 text-[13px] text-muted-foreground"
        >
          Down
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-2 text-[13px] text-destructive"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-baseline gap-2 py-3.5 text-left"
      >
        <ChevronRight
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 translate-y-0.5 text-muted-foreground/60 transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
        <span className="flex-1 text-[17px] leading-snug">{exercise.name}</span>
        {exercise.target_reps ? (
          <span className="text-[13px] tabular-nums text-muted-foreground/70">
            {exercise.target_reps}
          </span>
        ) : null}
      </button>

      {expanded ? (
        <ComparisonTable
          detail={detail}
          exerciseId={exercise.id}
          onSaveSet={onSaveSet}
          onSaveNote={onSaveNote}
        />
      ) : null}
    </div>
  );
}
