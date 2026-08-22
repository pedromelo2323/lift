"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ExerciseSession, ExerciseWithData, SetEntry, WorkoutDetail } from "@/types";
import { formatSessionDate, getTodayDateString } from "@/lib/utils/date";
import { upsertExerciseSession, updateExerciseNote } from "@/lib/workouts/mutations";
import {
  clearSessionDraft,
  readSessionDraft,
  writeSessionDraft,
} from "@/lib/workouts/session-draft";
import { workoutKey } from "@/lib/api/workouts";
import { EditableCell } from "@/components/EditableCell";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

type SessionTableProps = {
  exercise: ExerciseWithData;
};

function isSuggested(set: SetEntry, latest: SetEntry | undefined): boolean {
  if (!latest) return false;
  return set.weight === latest.weight && set.reps === latest.reps;
}

function buildInitialRows(exercise: ExerciseWithData, today: string): ExerciseSession[] {
  const todaySession = exercise.sessions.find((s) => s.session_date === today);
  const historySessions = exercise.sessions.filter((s) => s.session_date !== today).slice(0, 3);
  const rows = [...historySessions];
  const draft = readSessionDraft(exercise.id, today);

  if (draft) {
    rows.push({
      id: todaySession?.id ?? `local-${exercise.id}`,
      exercise_id: exercise.id,
      session_date: today,
      sets: draft.sets,
      created_at: todaySession?.created_at ?? new Date().toISOString(),
    });
    return rows;
  }

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
}

export function SessionTable({ exercise }: SessionTableProps) {
  const today = getTodayDateString();
  const queryClient = useQueryClient();
  const historySessions = useMemo(
    () => exercise.sessions.filter((s) => s.session_date !== today).slice(0, 3),
    [exercise.sessions, today],
  );
  const latestHistory = historySessions[0];

  const [rows, setRows] = useState(() => buildInitialRows(exercise, today));
  const [note, setNote] = useState(exercise.note ?? "");
  const [editingNote, setEditingNote] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const persistToday = (sets: SetEntry[], keepalive = false) => {
    writeSessionDraft(exercise.id, today, sets);
    queryClient.setQueryData<WorkoutDetail>(workoutKey(exercise.workout_id), (current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((item) => {
          if (item.id !== exercise.id) return item;
          const withoutToday = item.sessions.filter((session) => session.session_date !== today);
          const existingToday = item.sessions.find((session) => session.session_date === today);
          return {
            ...item,
            sessions: [
              ...withoutToday,
              {
                id: existingToday?.id ?? `local-${exercise.id}`,
                exercise_id: exercise.id,
                session_date: today,
                sets,
                created_at: existingToday?.created_at ?? new Date().toISOString(),
              },
            ],
          };
        }),
      };
    });

    void upsertExerciseSession(exercise.id, sets, keepalive ? { keepalive: true } : undefined)
      .then(() => clearSessionDraft(exercise.id, today))
      .catch(() => {
        // Keep the draft so a reload can restore unsaved numbers.
      });
  };
  const persistRef = useRef(persistToday);
  persistRef.current = persistToday;

  const saveSession = useDebouncedCallback((sets: SetEntry[]) => {
    persistRef.current(sets);
  }, 350);

  const saveNote = useDebouncedCallback((nextNote: string) => {
    void updateExerciseNote(exercise.id, nextNote);
  }, 400);

  useEffect(() => {
    const flush = () => {
      saveSession.flush();
      const todayRow = rowsRef.current.find((row) => row.session_date === today);
      if (todayRow && readSessionDraft(exercise.id, today)) {
        persistRef.current(todayRow.sets, true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [exercise.id, today, saveSession]);

  function updateSet(rowIndex: number, setIndex: number, weight: number | null, reps: number | null) {
    setRows((current) => {
      const next = current.map((row, i) => {
        if (i !== rowIndex) return row;
        const sets = row.sets.map((set, j) => (j === setIndex ? { weight, reps } : set));
        return { ...row, sets };
      });

      const todayRow = next.find((row) => row.session_date === today);
      if (todayRow) {
        writeSessionDraft(exercise.id, today, todayRow.sets);
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
                      onChange={(nextWeight, nextReps) =>
                        updateSet(rowIndex, setIndex, nextWeight, nextReps)
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
