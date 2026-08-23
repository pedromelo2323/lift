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
  const editingRef = useRef(false);
  const valuesRef = useRef({ weight, reps, weightStr, repsStr, onChange });

  editingRef.current = editing;
  valuesRef.current = { weight, reps, weightStr, repsStr, onChange };

  const display = formatSetValue(weight, reps);

  const commit = useCallback((opts?: { allowEmptyOverwrite?: boolean }) => {
    const current = valuesRef.current;
    setEditing(false);
    editingRef.current = false;
    const nextWeight = parseNumber(current.weightStr);
    const nextReps = parseNumber(current.repsStr);

    // iOS can clear focused inputs when the app is backgrounded. Don't treat
    // that as the user wiping a set they were mid-edit.
    if (
      !opts?.allowEmptyOverwrite &&
      nextWeight == null &&
      nextReps == null &&
      (current.weight != null || current.reps != null)
    ) {
      return;
    }

    if (nextWeight !== current.weight || nextReps !== current.reps) {
      current.onChange(nextWeight, nextReps);
    }
  }, []);

  useEffect(() => {
    if (editing) weightRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    const flushIfEditing = () => {
      if (!editingRef.current) return;
      commit({ allowEmptyOverwrite: false });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushIfEditing();
    };
    window.addEventListener("pagehide", flushIfEditing);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushIfEditing);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [commit]);

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
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            commit({ allowEmptyOverwrite: true });
          }
        }}
      >
        <input
          ref={weightRef}
          value={weightStr}
          inputMode="decimal"
          onChange={(e) => setWeightStr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit({ allowEmptyOverwrite: true })}
          placeholder="kg"
          aria-label="Weight in kg"
          className="w-8 bg-transparent text-right text-[15px] tabular-nums outline-none placeholder:text-muted-foreground/40"
        />
        <span className="text-muted-foreground">×</span>
        <input
          value={repsStr}
          inputMode="numeric"
          onChange={(e) => setRepsStr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit({ allowEmptyOverwrite: true })}
          placeholder="reps"
          aria-label="Reps"
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
      className={`w-full rounded-md py-1.5 text-center text-[15px] tabular-nums transition-colors duration-200 ${
        editable ? "active:bg-secondary" : "cursor-default"
      } ${suggested ? "text-muted-foreground/60" : "text-foreground"}`}
    >
      {display}
    </button>
  );
}
