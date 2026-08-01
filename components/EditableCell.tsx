"use client";

import { useEffect, useRef, useState } from "react";
import { formatSetValue, parseSetValue } from "@/lib/utils/date";

type EditableCellProps = {
  weight: number | null;
  reps: number | null;
  onChange: (weight: number | null, reps: number | null) => void;
  isToday?: boolean;
};

export function EditableCell({ weight, reps, onChange, isToday = false }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(formatSetValue(weight, reps));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(formatSetValue(weight, reps));
  }, [weight, reps]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit(nextValue: string) {
    const parsed = parseSetValue(nextValue);
    onChange(parsed.weight, parsed.reps);
    setValue(formatSetValue(parsed.weight, parsed.reps));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => commit(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(value);
          if (e.key === "Escape") {
            setValue(formatSetValue(weight, reps));
            setEditing(false);
          }
        }}
        className={`w-full rounded-md border border-[#D1D1D6] bg-white px-1 py-0.5 text-center text-[13px] outline-none focus:border-[#1D1D1F] ${
          isToday ? "font-medium text-[#1D1D1F]" : "text-[#1D1D1F]"
        }`}
        inputMode="text"
        aria-label="Edit set"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`w-full rounded-md px-1 py-0.5 text-[13px] transition-colors duration-200 hover:bg-[#F5F5F7] ${
        isToday ? "font-medium text-[#1D1D1F]" : "text-[#1D1D1F]"
      }`}
    >
      {formatSetValue(weight, reps)}
    </button>
  );
}
