import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import type { WorkoutDetail } from "@/lib/lift/types";
import {
  buildRows,
  formatDay,
  isBetter,
  notesFor,
  previousBest,
  progressionHint,
  stalledSets,
} from "@/lib/lift/model";
import { cn } from "@/lib/utils";
import { SetCell } from "./set-cell";
import { haptic, unitLabel, usePrefs } from "@/lib/lift/prefs";

type Props = {
  detail: WorkoutDetail;
  exerciseId: string;
  onSaveSet: (setIndex: number, weight: number | null, reps: number | null) => void;
  onSaveNote: (note: string | null) => void;
};

export function ComparisonTable({ detail, exerciseId, onSaveSet: save, onSaveNote }: Props) {
  usePrefs();
  const rows = buildRows(detail, exerciseId);
  const setCount = rows[0]?.values.length ?? 3;
  const stalled = stalledSets(detail, exerciseId);
  const notes = notesFor(detail, exerciseId);
  const best = previousBest(detail, exerciseId);
  const hint = progressionHint(detail, exerciseId);
  const onSaveSet = (i: number, weight: number | null, reps: number | null) => {
    haptic(best && isBetter({ weight, reps }, best) ? [15, 40, 15] : 10);
    save(i, weight, reps);
  };
  const todayRow = rows[rows.length - 1];
  const pending = todayRow
    ? todayRow.values
        .map((v, i) => ({ v, i }))
        .filter(({ v, i }) => todayRow.suggested[i] && (v.weight != null || v.reps != null))
    : [];
  const [noteDraft, setNoteDraft] = useState(notes.today ?? "");
  const [editingNote, setEditingNote] = useState(false);

  return (
    <div className="pb-5 pl-1 pr-1">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="w-16 pb-2 text-left text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
              Date
            </th>
            {Array.from({ length: setCount }, (_, i) => (
              <th
                key={i}
                className="pb-2 text-center text-[11px] font-normal uppercase tracking-wider text-muted-foreground"
              >
                <span className="block">Set {i + 1}</span>
                <span className="block text-[10px] normal-case tracking-normal text-muted-foreground/50">
                  {unitLabel()} × reps
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td
                className={cn(
                  "border-t border-border py-1 pr-2 text-[13px]",
                  row.isToday ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {row.label}
              </td>
              {row.skipped ? (
                <td
                  colSpan={setCount}
                  className="border-t border-border py-1.5 text-center text-[13px] italic text-muted-foreground/60"
                >
                  Skipped
                </td>
              ) : (
                row.values.map((value, i) => {
                  const isPB =
                    row.isToday &&
                    !(row.suggested[i] ?? false) &&
                    best != null &&
                    isBetter(value, best);
                  return (
                    <td key={i} className="border-t border-border">
                      <div
                        className={cn(
                          "relative rounded-md",
                          isPB && "animate-pb-flash",
                        )}
                      >
                        <SetCell
                          value={value}
                          suggested={row.isToday && (row.suggested[i] ?? false)}
                          editable={row.isToday}
                          onCommit={(next) => onSaveSet(i, next.weight, next.reps)}
                        />
                        {isPB ? (
                          <span
                            aria-label="Personal best"
                            className="pointer-events-none absolute -right-0.5 top-0.5 text-[10px] tracking-tight text-foreground/50"
                          >
                            PB
                          </span>
                        ) : row.improved[i] ? (
                          <ArrowUp
                            aria-label="Better than last session"
                            className="pointer-events-none absolute -right-0 top-1 size-3 text-foreground/40"
                          />
                        ) : null}
                      </div>
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {pending.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            haptic(10);
            pending.forEach(({ v, i }) => save(i, v.weight, v.reps));
          }}
          className="mt-3 text-[13px] text-muted-foreground underline decoration-border underline-offset-4"
        >
          Same as last time
        </button>
      ) : null}

      {hint ? (
        <p className="mt-3 text-[12px] leading-relaxed text-foreground/70">{hint}</p>
      ) : null}

      {stalled.length > 0 && !hint ? (
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/70">
          {stalled.length === setCount
            ? "Same numbers for 3 sessions — maybe time to change something."
            : `Set ${stalled.map((i) => i + 1).join(", ")} hasn't moved in 3 sessions.`}
        </p>
      ) : null}

      {editingNote ? (
        <input
          autoFocus
          value={noteDraft}
          placeholder={
            notes.previous ? `Last time: ${notes.previous.body}` : "Note for today"
          }
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            setEditingNote(false);
            const next = noteDraft.trim();
            if (next !== (notes.today ?? "")) onSaveNote(next === "" ? null : next);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="mt-4 w-full bg-transparent text-[13px] leading-relaxed text-muted-foreground outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setNoteDraft(notes.today ?? "");
            setEditingNote(true);
          }}
          className="mt-4 block w-full text-left text-[13px] leading-relaxed text-muted-foreground"
        >
          {notes.today ?? <span className="text-muted-foreground/40">Add a note</span>}
        </button>
      )}

      {notes.previous && notes.previous.body !== notes.today ? (
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground/45">
          {formatDay(notes.previous.date)}: {notes.previous.body}
        </p>
      ) : null}

      <div className="mt-3 flex justify-end">
        <Link
          to="/exercise/$exerciseId"
          params={{ exerciseId }}
          aria-label="All sessions for this exercise"
          className="-mr-1 p-1 text-muted-foreground/40"
        >
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  );
}
