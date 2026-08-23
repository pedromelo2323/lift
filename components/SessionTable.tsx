"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ExerciseSession, ExerciseWithData, SetEntry, WorkoutDetail } from "@/types";
import { formatSessionDate, getTodayDateString } from "@/lib/utils/date";
import { isBetter, stalledSetIndexes } from "@/lib/utils/progress";
import {
  deleteExerciseSession,
  upsertExerciseSession,
  updateExerciseNote,
} from "@/lib/workouts/mutations";
import {
  clearSessionDraft,
  readSessionDraft,
  writeSessionDraft,
} from "@/lib/workouts/session-draft";
import { workoutKey } from "@/lib/api/workouts";
import { EditableCell } from "@/components/EditableCell";
import { SwipeDeleteRow } from "@/components/SwipeDeleteRow";
import { UndoToast } from "@/components/UndoToast";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

type SessionTableProps = {
  exercise: ExerciseWithData;
};

type PendingDelete = {
  session: ExerciseSession;
  timer: ReturnType<typeof setTimeout>;
};

function isSuggested(set: SetEntry, latest: SetEntry | undefined): boolean {
  if (!latest) return false;
  return set.weight === latest.weight && set.reps === latest.reps;
}

function buildInitialRows(exercise: ExerciseWithData, today: string): ExerciseSession[] {
  const todaySession = exercise.sessions.find((s) => s.session_date === today);
  const historySessions = exercise.sessions.filter((s) => s.session_date !== today);
  const rows = [...historySessions];
  const draft = readSessionDraft(exercise.id, today);

  if (draft) {
    rows.push({
      id: todaySession?.id ?? `local-${exercise.id}`,
      exercise_id: exercise.id,
      session_date: today,
      sets: draft.sets,
      note: todaySession?.note ?? exercise.note,
      created_at: todaySession?.created_at ?? new Date().toISOString(),
    });
    return rows;
  }

  if (todaySession) {
    rows.push(todaySession);
  } else {
    const latest = historySessions[historySessions.length - 1];
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
      note: null,
      created_at: new Date().toISOString(),
    });
  }
  return rows;
}

function ArrowUpIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="pointer-events-none absolute -right-0.5 top-1 text-foreground/40"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function HistoryArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function isPersistedSession(session: ExerciseSession) {
  return !session.id.startsWith("local-") && !session.id.startsWith("temp-") && !session.id.startsWith("draft-");
}

export function SessionTable({ exercise }: SessionTableProps) {
  const today = getTodayDateString();
  const queryClient = useQueryClient();

  const historyNewestFirst = useMemo(
    () =>
      [...exercise.sessions.filter((s) => s.session_date !== today)].sort((a, b) =>
        a.session_date < b.session_date ? 1 : a.session_date > b.session_date ? -1 : 0,
      ),
    [exercise.sessions, today],
  );
  const latestHistory = historyNewestFirst[0];
  const stalled = useMemo(
    () => stalledSetIndexes(historyNewestFirst),
    [historyNewestFirst],
  );
  const [rows, setRows] = useState(() => buildInitialRows(exercise, today));
  const [note, setNote] = useState(exercise.note ?? "");
  const [editingNote, setEditingNote] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const pendingRef = useRef<PendingDelete | null>(null);

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
            note: existingToday?.note ?? item.note,
            sessions: [
              ...withoutToday,
              {
                id: existingToday?.id ?? `local-${exercise.id}`,
                exercise_id: exercise.id,
                session_date: today,
                sets,
                note: existingToday?.note ?? item.note,
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
    const todayRow = rowsRef.current.find((row) => row.session_date === today);
    void updateExerciseNote(exercise.id, nextNote, todayRow?.sets).then(() => {
      queryClient.setQueryData<WorkoutDetail>(workoutKey(exercise.workout_id), (current) => {
        if (!current) return current;
        return {
          ...current,
          exercises: current.exercises.map((item) => {
            if (item.id !== exercise.id) return item;
            const trimmed = nextNote.trim() || null;
            return {
              ...item,
              note: trimmed,
              sessions: item.sessions.map((session) =>
                session.session_date === today ? { ...session, note: trimmed } : session,
              ),
            };
          }),
        };
      });
    });
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

  useEffect(
    () => () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        void deleteExerciseSession(exercise.id, pendingRef.current.session.session_date);
      }
    },
    [exercise.id],
  );

  function patchCacheSessions(nextSessions: ExerciseSession[], nextNote?: string | null) {
    queryClient.setQueryData<WorkoutDetail>(workoutKey(exercise.workout_id), (current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((item) => {
          if (item.id !== exercise.id) return item;
          return {
            ...item,
            note: nextNote !== undefined ? nextNote : item.note,
            sessions: nextSessions,
          };
        }),
      };
    });
  }

  function requestDelete(session: ExerciseSession) {
    if (session.session_date === today || !isPersistedSession(session)) return;

    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      void deleteExerciseSession(exercise.id, pendingRef.current.session.session_date);
    }

    const nextRows = rowsRef.current.filter((row) => row.session_date !== session.session_date);
    setRows(nextRows);
    patchCacheSessions(nextRows);

    const timer = setTimeout(() => {
      void deleteExerciseSession(exercise.id, session.session_date);
      pendingRef.current = null;
      setPendingDelete(null);
    }, 5000);

    const pending = { session, timer };
    pendingRef.current = pending;
    setPendingDelete(pending);
  }

  function undoDelete() {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    setPendingDelete(null);

    const restored = [...rowsRef.current, pending.session].sort((a, b) => {
      if (a.session_date === today) return 1;
      if (b.session_date === today) return -1;
      return a.session_date < b.session_date ? -1 : a.session_date > b.session_date ? 1 : 0;
    });
    setRows(restored);
    patchCacheSessions(restored);
    void upsertExerciseSession(exercise.id, pending.session.sets, {
      sessionDate: pending.session.session_date,
      note: pending.session.note,
    });
  }

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

  const setCount = 3;
  const dateLabel = pendingDelete
    ? formatSessionDate(pendingDelete.session.session_date)
    : "";

  return (
    <div className="pb-3 pl-1 pr-1">
      <div className="flex items-end pb-2">
        <div className="w-16 shrink-0 text-left text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
          Date
        </div>
        {Array.from({ length: setCount }, (_, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 text-center text-[11px] font-normal uppercase tracking-wider text-muted-foreground"
          >
            <span className="block">Set {i + 1}</span>
            <span className="block text-[10px] normal-case tracking-normal text-muted-foreground/50">
              kg × reps
            </span>
          </div>
        ))}
      </div>

      <div>
        {rows.map((row, rowIndex) => {
          const isToday = row.session_date === today;
          const rowBody = (
            <div className="flex items-stretch bg-background">
              <div
                className={`flex w-16 shrink-0 items-center py-1 pr-2 text-[13px] ${
                  isToday ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {formatSessionDate(row.session_date, isToday)}
              </div>
              {row.sets.slice(0, setCount).map((set, setIndex) => {
                const suggested =
                  isToday &&
                  isSuggested(set, latestHistory?.sets[setIndex]) &&
                  set.weight != null;
                const improved =
                  isToday && !suggested && isBetter(set, latestHistory?.sets[setIndex]);
                return (
                  <div key={setIndex} className="min-w-0 flex-1">
                    <div className="relative">
                      <EditableCell
                        weight={set.weight}
                        reps={set.reps}
                        editable={isToday}
                        suggested={suggested}
                        onChange={(nextWeight, nextReps) =>
                          updateSet(rowIndex, setIndex, nextWeight, nextReps)
                        }
                      />
                      {improved ? <ArrowUpIcon /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          );

          if (isToday) {
            return (
              <div key={row.id} className="border-t border-border">
                {rowBody}
              </div>
            );
          }

          return (
            <SwipeDeleteRow
              key={row.id}
              disabled={!isPersistedSession(row)}
              onDelete={() => requestDelete(row)}
            >
              {rowBody}
            </SwipeDeleteRow>
          );
        })}
      </div>

      {stalled.length > 0 ? (
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/70">
          {stalled.length === setCount
            ? "Same numbers for 3 sessions — maybe time to change something."
            : `Set ${stalled.map((i) => i + 1).join(", ")} hasn't moved in 3 sessions.`}
        </p>
      ) : null}

      <div className="mt-3 flex items-start gap-2">
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
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-relaxed text-muted-foreground outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setNote(exercise.note ?? "");
              setEditingNote(true);
            }}
            className="min-w-0 flex-1 text-left text-[13px] leading-relaxed text-muted-foreground"
          >
            {note ? note : <span className="text-muted-foreground/40">Add a note</span>}
          </button>
        )}
        <Link
          href={`/exercise/${exercise.id}`}
          aria-label="All sessions for this exercise"
          className="-mr-1 shrink-0 p-1 text-muted-foreground/40"
        >
          <HistoryArrowIcon />
        </Link>
      </div>

      {pendingDelete ? (
        <UndoToast
          message={`${dateLabel} log for ${exercise.name} was deleted`}
          onUndo={undoDelete}
        />
      ) : null}
    </div>
  );
}
