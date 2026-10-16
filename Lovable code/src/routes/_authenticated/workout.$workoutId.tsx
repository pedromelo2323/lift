import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useWorkoutDetail, useWorkoutMutations } from "@/hooks/use-lift";
import { ExerciseRow } from "@/components/lift/exercise-row";
import { RestTimer } from "@/components/lift/rest-timer";
import { ShareSession } from "@/components/lift/share-session";
import { EditExerciseList } from "@/components/lift/edit-exercise-list";
import type { Exercise } from "@/lib/lift/types";
import { FirstHint, dismissHint } from "@/components/lift/first-hint";

export const Route = createFileRoute("/_authenticated/workout/$workoutId")({
  head: () => ({
    meta: [
      { title: "Workout — Lift" },
      {
        name: "description",
        content: "Expand an exercise to compare your last sessions and log today's sets.",
      },
      { property: "og:title", content: "Workout — Lift" },
      {
        property: "og:description",
        content: "Expand an exercise to compare your last sessions and log today's sets.",
      },
    ],
  }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { workoutId } = Route.useParams();
  const { data: detail, isPending, isError } = useWorkoutDetail(workoutId);
  const m = useWorkoutMutations(workoutId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const exercises = detail?.exercises ?? [];

  // Consecutive exercises joined by linked_to_next form one superset group.
  const groups: Exercise[][] = [];
  exercises.forEach((e, i) => {
    if (i > 0 && exercises[i - 1]!.linked_to_next) groups[groups.length - 1]!.push(e);
    else groups.push([e]);
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <Link
          to="/home"
          className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Workouts
        </Link>
        <div className="flex items-center gap-4">
          {detail ? <ShareSession detail={detail} /> : null}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-[15px] text-muted-foreground"
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">
        {detail?.workout.name ?? " "}
      </h1>

      {!editing && exercises.length > 0 ? (
        <FirstHint id="workout-log" className="mt-5">
          Tap an exercise to log today. Your last session is pre-filled — just change what's different.
        </FirstHint>
      ) : null}
      {editing && exercises.length > 1 ? (
        <FirstHint id="workout-edit" className="mt-5">
          Drag the handle to reorder. Tap Pair between two exercises to make a superset.
        </FirstHint>
      ) : null}

      <div className="mt-6">
        {isError ? (
          <p className="text-[15px] text-muted-foreground">Couldn't load this workout.</p>
        ) : isPending ? (
          <div className="space-y-px">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[56px] animate-pulse border-b border-border" />
            ))}
          </div>
        ) : (
          editing ? (
            <EditExerciseList
              exercises={exercises}
              onReorder={(ordered) => m.reorder.mutate(ordered)}
              onRename={(id, name) => m.renameExercise.mutate({ id, name })}
              onDelete={(id) => m.removeExercise.mutate(id)}
            />
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group[0]!.id}
                  className={group.length > 1 ? "relative border-l border-foreground pl-3" : undefined}
                >
                  {group.length > 1 ? (
                    <p className="pt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Superset
                    </p>
                  ) : null}
                  {group.map((exercise) => (
                    <ExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      detail={detail}
                      editing={false}
                      expanded={expanded === exercise.id}
                      onToggle={() => {
                        dismissHint("workout-log");
                        setExpanded((v) => (v === exercise.id ? null : exercise.id));
                      }}
                      onRename={(name) => m.renameExercise.mutate({ id: exercise.id, name })}
                      onDelete={() => m.removeExercise.mutate(exercise.id)}
                      onMove={() => {}}
                      onSaveSet={(setIndex, weight, reps) =>
                        m.saveSet.mutate({ exerciseId: exercise.id, setIndex, weight, reps })
                      }
                      onSaveNote={(note) => m.saveNote.mutate({ id: exercise.id, note })}
                    />
                  ))}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {editing ? (
        <button
          type="button"
          onClick={() =>
            m.createExercise.mutate({ name: "New exercise", position: exercises.length })
          }
          className="mt-5 text-[15px] text-muted-foreground"
        >
          Add exercise
        </button>
      ) : null}

      <RestTimer />
    </main>
  );
}
