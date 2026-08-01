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

export function SessionTable({ exercise, workoutId }: SessionTableProps) {
  const today = getTodayDateString();
  const todaySession = exercise.sessions.find((s) => s.session_date === today);
  const historySessions = exercise.sessions.filter((s) => s.session_date !== today).slice(0, 3);

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
  const [showNote, setShowNote] = useState(Boolean(exercise.note));

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
    <div className="space-y-4 pb-2">
      <div className="overflow-hidden rounded-xl border border-[#E5E5EA]">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E5E5EA] bg-[#FAFAFA]">
              <th className="w-[22%] px-2 py-2 text-[11px] font-medium uppercase tracking-[0.04em] text-[#86868B]">
                Date
              </th>
              {[1, 2, 3].map((setNumber) => (
                <th
                  key={setNumber}
                  className="px-1 py-2 text-center text-[11px] font-medium uppercase tracking-[0.04em] text-[#86868B]"
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
                <tr
                  key={row.id}
                  className={`border-b border-[#F0F0F2] last:border-b-0 ${
                    isToday ? "bg-[#FAFAFA]" : "bg-white"
                  }`}
                >
                  <td className="px-2 py-1.5 text-[13px] text-[#86868B]">
                    {formatSessionDate(row.session_date, isToday)}
                  </td>
                  {row.sets.slice(0, 3).map((set, setIndex) => (
                    <td key={setIndex} className="px-1 py-1">
                      {isToday ? (
                        <EditableCell
                          weight={set.weight}
                          reps={set.reps}
                          isToday
                          onChange={(weight, reps) =>
                            updateSet(rowIndex, setIndex, weight, reps)
                          }
                        />
                      ) : (
                        <span className="block px-1 py-0.5 text-center text-[13px] text-[#1D1D1F]">
                          {set.weight != null && set.reps != null
                            ? `${set.weight}×${set.reps}`
                            : "—"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(showNote || note) && (
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            saveNote(e.target.value);
          }}
          placeholder="Add a note..."
          rows={2}
          className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-[15px] text-[#1D1D1F] outline-none transition-colors duration-200 placeholder:text-[#C7C7CC] focus:border-[#D1D1D6]"
        />
      )}

      {!showNote && !note && (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="text-[14px] text-[#86868B] transition-colors duration-200 hover:text-[#1D1D1F]"
        >
          Add note
        </button>
      )}
    </div>
  );
}
