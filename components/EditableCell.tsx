"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatSetValue } from "@/lib/utils/date";

type EditableCellProps = {
  weight: number | null;
  reps: number | null;
  suggested?: boolean;
  editable?: boolean;
  onChange: (weight: number | null, reps: number | null) => void;
};

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export function EditableCell({
  weight,
  reps,
  suggested = false,
  editable = true,
  onChange,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [weightStr, setWeightStr] = useState("");
  const [repsStr, setRepsStr] = useState("");
  const weightRef = useRef<HTMLInputElement>(null);

  const display = formatSetValue(weight, reps);

  const commit = useCallback(() => {
    setEditing(false);
    const nextWeight = parseNumber(weightStr);
    const nextReps = parseNumber(repsStr);
    if (nextWeight !== weight || nextReps !== reps) {
      onChange(nextWeight, nextReps);
    }
  }, [onChange, reps, repsStr, weight, weightStr]);

  useEffect(() => {
    if (editing) weightRef.current?.focus();
  }, [editing]);

  function start() {
    if (!editable) return;
    setWeightStr(weight == null ? "" : String(Number(weight)));
    setRepsStr(reps == null ? "" : String(reps));
    setEditing(true);
  }

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
          value={weightStr}
          inputMode="decimal"
          onChange={(e) => setWeightStr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          aria-label="Weight"
          className="w-8 bg-transparent text-right text-[15px] tabular-nums outline-none"
        />
        <span className="text-muted-foreground">×</span>
        <input
          value={repsStr}
          inputMode="numeric"
          onChange={(e) => setRepsStr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          aria-label="Reps"
          className="w-7 bg-transparent text-left text-[15px] tabular-nums outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={!editable}
      className={`w-full rounded-md py-1.5 text-center text-[15px] tabular-nums transition-colors duration-200 ${
        editable ? "active:bg-secondary" : "cursor-default"
      } ${suggested ? "text-muted-foreground/60" : "text-foreground"}`}
    >
      {display}
    </button>
  );
}
