"use client";

import { useMemo, useState } from "react";
import type { ExerciseWithData, SetEntry } from "@/types";
import { formatSessionDate, getTodayDateString } from "@/lib/utils/date";
import { upsertExerciseSession, updateExerciseNote } from "@/lib/actions/workouts";
import { EditableCell } from "@/components/EditableCell";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

type SessionTableProps = {
  exercise: ExerciseWithData;
  workoutId: string;
};

function isSuggested(set: SetEntry, latest: SetEntry | undefined): boolean {
  if (!latest) return false;
  return set.weight === latest.weight && set.reps === latest.reps;
}

export function SessionTable({ exercise, workoutId }: SessionTableProps) {
  const today = getTodayDateString();
  const todaySession = exercise.sessions.find((s) => s.session_date === today);
  const historySessions = exercise.sessions.filter((s) => s.session_date !== today).slice(0, 3);
  const latestHistory = historySessions[0];

  const initialRows = useMemo(() => {
    const rows = [...historySessions];
    if (todaySession) {
      rows.push(todaySession);
    } else {
      const latest = historySessions[0];
      rows.push({
        id: `local-${exercise.id}`,
        exercise_id: exercise.id,
        session_date: today,
        sets: latest
          ? latest.sets.map((set) => ({ ...set }))
          : [
              { weight: null, reps: null },
              { weight: null, reps: null },
              { weight: null, reps: null },
            ],
        created_at: new Date().toISOString(),
      });
    }
    return rows;
  }, [exercise.id, historySessions, today, todaySession]);

  const [rows, setRows] = useState(initialRows);
  const [note, setNote] = useState(exercise.note ?? "");
  const [editingNote, setEditingNote] = useState(false);

  const saveSession = useDebouncedCallback(async (sets: SetEntry[]) => {
    await upsertExerciseSession(exercise.id, workoutId, sets);
  }, 350);

  const saveNote = useDebouncedCallback(async (nextNote: string) => {
    await updateExerciseNote(exercise.id, workoutId, nextNote);
  }, 400);

  function updateSet(rowIndex: number, setIndex: number, weight: number | null, reps: number | null) {
    setRows((current) => {
      const next = current.map((row, i) => {
        if (i !== rowIndex) return row;
        const sets = row.sets.map((set, j) =>
          j === setIndex ? { weight, reps } : set,
        );
        return { ...row, sets };
      });

      const todayRow = next.find((row) => row.session_date === today);
      if (todayRow) {
        saveSession(todayRow.sets);
      }

      return next;
    });
  }

  return (
    <div className="pb-5 pl-1 pr-1">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="w-16 pb-2 text-left text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
              Date
            </th>
            {[1, 2, 3].map((setNumber) => (
              <th
                key={setNumber}
                className="pb-2 text-center text-[11px] font-normal uppercase tracking-wider text-muted-foreground"
              >
                Set {setNumber}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isToday = row.session_date === today;
            return (
              <tr key={row.id}>
                <td
                  className={`border-t border-border py-1 pr-2 text-[13px] ${
                    isToday ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {formatSessionDate(row.session_date, isToday)}
                </td>
                {row.sets.slice(0, 3).map((set, setIndex) => (
                  <td key={setIndex} className="border-t border-border">
                    <EditableCell
                      weight={set.weight}
                      reps={set.reps}
                      editable={isToday}
                      suggested={
                        isToday &&
                        isSuggested(set, latestHistory?.sets[setIndex]) &&
                        set.weight != null
                      }
                      onChange={(weight, reps) =>
                        updateSet(rowIndex, setIndex, weight, reps)
                      }
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {editingNote ? (
        <input
          autoFocus
          value={note}
          placeholder="Note"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            setEditingNote(false);
            saveNote(note.trim());
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="mt-4 w-full bg-transparent text-[13px] leading-relaxed text-muted-foreground outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setNote(exercise.note ?? "");
            setEditingNote(true);
          }}
          className="mt-4 block w-full text-left text-[13px] leading-relaxed text-muted-foreground"
        >
          {note ? note : <span className="text-muted-foreground/40">Add a note</span>}
        </button>
      )}
    </div>
  );
}
