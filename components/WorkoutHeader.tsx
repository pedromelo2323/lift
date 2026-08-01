"use client";

import { useState } from "react";
import Link from "next/link";
import { updateWorkoutName } from "@/lib/actions/workouts";

type WorkoutHeaderProps = {
  workoutId: string;
  name: string;
};

export function WorkoutHeader({ workoutId, name }: WorkoutHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  async function save(nextName: string) {
    await updateWorkoutName(workoutId, nextName.trim() || name);
    setEditing(false);
  }

  return (
    <header className="mb-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-[15px] text-[#86868B] transition-colors duration-200 hover:text-[#1D1D1F]"
      >
        ← Back
      </Link>

      {editing ? (
        <input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => save(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save(draft);
            if (e.key === "Escape") {
              setDraft(name);
              setEditing(false);
            }
          }}
          className="w-full bg-transparent text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F] outline-none"
        />
      ) : (
        <h1
          className="text-[28px] font-semibold tracking-[-0.03em] text-[#1D1D1F]"
          onDoubleClick={() => {
            setDraft(name);
            setEditing(true);
          }}
        >
          {name}
        </h1>
      )}
    </header>
  );
}
