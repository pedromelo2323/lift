import { useEffect, useRef, useState } from "react";
import type { SetValue } from "@/lib/lift/model";
import { formatValue } from "@/lib/lift/model";
import { cn } from "@/lib/utils";
import { fromDisplayWeight, toDisplayWeight, unitLabel, usePrefs } from "@/lib/lift/prefs";

type Props = {
  value: SetValue;
  suggested: boolean;
  editable: boolean;
  onCommit: (value: SetValue) => void;
};

function toNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function SetCell({ value, suggested, editable, onCommit }: Props) {
  usePrefs();
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const weightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) weightRef.current?.focus();
  }, [editing]);

  const start = () => {
    if (!editable) return;
    setWeight(value.weight == null ? "" : String(toDisplayWeight(Number(value.weight))));
    setReps(value.reps == null ? "" : String(value.reps));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const w = toNumber(weight);
    const next = { weight: w == null ? null : w === toDisplayWeight(Number(value.weight ?? NaN)) ? value.weight : fromDisplayWeight(w), reps: toNumber(reps) };
    if (suggested || next.weight !== value.weight || next.reps !== value.reps) onCommit(next);
  };

  if (editing) {
    return (
      <div
        className="flex items-center justify-center gap-0.5 rounded-md bg-secondary px-1 py-1"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) commit();
        }}
      >
        <input
          ref={weightRef}
          value={weight}
          inputMode="decimal"
          placeholder={unitLabel()}
          aria-label={`Weight in ${unitLabel()}`}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-8 bg-transparent text-right text-[15px] tabular-nums outline-none placeholder:text-muted-foreground/40"
        />
        <span className="text-muted-foreground">×</span>
        <input
          value={reps}
          inputMode="numeric"
          placeholder="reps"
          aria-label="Reps"
          onChange={(e) => setReps(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-9 bg-transparent text-left text-[15px] tabular-nums outline-none placeholder:text-muted-foreground/40"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={!editable}
      className={cn(
        "w-full rounded-md py-1.5 text-center text-[15px] tabular-nums transition-colors duration-200",
        editable ? "active:bg-secondary" : "cursor-default",
        suggested ? "text-muted-foreground/60" : "text-foreground",
      )}
    >
      {formatValue(value)}
    </button>
  );
}
