"use client";

import { useRef, useState } from "react";
import { CloseIcon } from "@/components/onboarding/icons";
import { formatRepRange } from "@/lib/utils/workout";
import type { Plan, PlanExercise } from "@/lib/onboarding/plan";

type Props = {
  options: Plan[];
  note?: string | undefined;
  busy: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onConfirm: (plan: Plan) => void;
};

function setsLabel(setsReps: string) {
  const sets = setsReps.match(/^(\d+)\s*[×x*]/)?.[1];
  const reps = formatRepRange(setsReps);
  return sets ? `${sets} × ${reps}` : reps;
}

export function PlanPreview({ options, note, busy, canRegenerate, onRegenerate, onConfirm }: Props) {
  const [plans, setPlans] = useState(options);
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const multi = plans.length > 1;

  const updateExercises = (
    planIndex: number,
    workoutIndex: number,
    change: (exercises: PlanExercise[]) => PlanExercise[],
  ) =>
    setPlans((all) =>
      all.map((plan, i) =>
        i !== planIndex
          ? plan
          : {
              ...plan,
              workouts: plan.workouts.map((w, j) =>
                j === workoutIndex ? { ...w, exercises: change(w.exercises) } : w,
              ),
            },
      ),
    );

  const goTo = (index: number) =>
    scroller.current?.scrollTo({ left: index * scroller.current.clientWidth, behavior: "smooth" });

  return (
    <>
      {note ? <p className="mb-4 text-[13px] text-muted-foreground">{note}</p> : null}
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">
        {multi ? "Pick your plan" : plans[0]?.name}
      </h1>
      <p className="mt-1 text-[17px] text-muted-foreground">
        {multi ? "Swipe to compare. Everything stays editable." : `${plans[0]?.blurb ?? ""} Tap a name to rename.`}
      </p>

      {multi ? (
        <div className="mt-6 flex items-center gap-2">
          {plans.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                active === i ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
              }`}
            >
              Option {i + 1}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="-mx-6 mt-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {plans.map((plan, planIndex) => (
          <div key={planIndex} className="w-full shrink-0 snap-center px-6">
            {multi ? (
              <div className="mb-6">
                <p className="text-[22px] font-medium tracking-tight">{plan.name}</p>
                <p className="text-[13px] text-muted-foreground">{plan.blurb}</p>
              </div>
            ) : null}

            <div className="space-y-8">
              {plan.workouts.map((workout, workoutIndex) => (
                <section key={workoutIndex}>
                  <h2 className="text-[19px] font-medium tracking-tight">{workout.name}</h2>
                  <ul className="mt-2">
                    {workout.exercises.map((exercise, exerciseIndex) => {
                      const inSuperset =
                        exercise.linked_to_next || workout.exercises[exerciseIndex - 1]?.linked_to_next;
                      return (
                        <li
                          key={exerciseIndex}
                          className={`flex items-center gap-2 border-b border-border py-1.5 text-[15px] ${
                            inSuperset ? "border-l border-l-foreground pl-3" : ""
                          }`}
                        >
                          <input
                            value={exercise.name}
                            aria-label="Exercise name"
                            onChange={(e) =>
                              updateExercises(planIndex, workoutIndex, (all) =>
                                all.map((x, j) => (j === exerciseIndex ? { ...x, name: e.target.value } : x)),
                              )
                            }
                            className="min-w-0 flex-1 bg-transparent py-1 outline-none"
                          />
                          <span className="shrink-0 text-[13px] text-muted-foreground">
                            {setsLabel(exercise.sets_reps)}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${exercise.name}`}
                            onClick={() =>
                              updateExercises(planIndex, workoutIndex, (all) =>
                                all
                                  .filter((_, j) => j !== exerciseIndex)
                                  .map((x, j, rest) => (j === rest.length - 1 ? { ...x, linked_to_next: false } : x)),
                              )
                            }
                            className="p-1 text-muted-foreground/50"
                          >
                            <CloseIcon size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm(plan)}
              className="mt-10 w-full rounded-xl bg-foreground py-3 text-[15px] font-medium text-background transition-opacity disabled:opacity-40"
            >
              {busy ? "Setting up…" : multi ? "Go with this" : "Start with this plan"}
            </button>
          </div>
        ))}
      </div>

      {canRegenerate ? (
        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="mt-4 w-full text-center text-[13px] text-muted-foreground"
        >
          Show me two other options
        </button>
      ) : null}
    </>
  );
}
