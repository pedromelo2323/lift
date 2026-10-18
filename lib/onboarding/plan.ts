// Shared by the onboarding screens and the plan API route.
import { normalizeSetsReps } from "@/lib/utils/workout";

export const GOALS = ["Get stronger", "Build muscle", "Tone & lean", "General fitness"] as const;
export const DAYS = [2, 3, 4, 5, 6] as const;
export const SPLITS = ["Push / Pull / Legs", "Upper / Lower", "Full body"] as const;
export const SESSION_MINUTES = [30, 45, 60, 90] as const;
export const EXPERIENCE = ["New", "Some", "Experienced"] as const;
export const SEXES = ["Female", "Male", "Other"] as const;
export const AGE_RANGES = ["Under 25", "25–34", "35–44", "45–54", "55+"] as const;

export const PLAN_LIMIT = 3;
export const NOTES_MAX_LENGTH = 1500;

export type AboutYou = {
  age_range: (typeof AGE_RANGES)[number];
  sex: (typeof SEXES)[number];
  goal: (typeof GOALS)[number];
  days_per_week: (typeof DAYS)[number];
  session_minutes: (typeof SESSION_MINUTES)[number];
  experience: (typeof EXPERIENCE)[number];
  split?: (typeof SPLITS)[number] | undefined;
};

export type PlanExercise = { name: string; sets_reps: string; linked_to_next?: boolean };
export type PlanWorkout = { name: string; exercises: PlanExercise[] };
export type Plan = { id: string; name: string; blurb: string; workouts: PlanWorkout[] };

export type PlanResponse = {
  plans: Plan[];
  remaining: number;
  error?: "limit" | "unavailable" | "failed";
};

function oneOf<T>(values: readonly T[], value: unknown): value is T {
  return values.includes(value as T);
}

/** Returns the answers if every required field holds an allowed value. */
export function parseAboutYou(input: unknown): AboutYou | null {
  if (!input || typeof input !== "object") return null;
  const a = input as Record<string, unknown>;
  if (
    !oneOf(AGE_RANGES, a.age_range) ||
    !oneOf(SEXES, a.sex) ||
    !oneOf(GOALS, a.goal) ||
    !oneOf(DAYS, a.days_per_week) ||
    !oneOf(SESSION_MINUTES, a.session_minutes) ||
    !oneOf(EXPERIENCE, a.experience)
  ) {
    return null;
  }
  return {
    age_range: a.age_range,
    sex: a.sex,
    goal: a.goal,
    days_per_week: a.days_per_week,
    session_minutes: a.session_minutes,
    experience: a.experience,
    split: oneOf(SPLITS, a.split) ? a.split : undefined,
  };
}

export const TEMPLATES: Plan[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    blurb: "Three days, classic split.",
    workouts: [
      {
        name: "Push",
        exercises: [
          { name: "Bench press", sets_reps: "4×8–10" },
          { name: "Incline dumbbell press", sets_reps: "3×10–12" },
          { name: "Shoulder press", sets_reps: "3×8–10" },
          { name: "Lateral raise", sets_reps: "3×12–15" },
          { name: "Triceps pushdown", sets_reps: "3×12–15" },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { name: "Pull-up", sets_reps: "4×6–10" },
          { name: "Barbell row", sets_reps: "3×8–10" },
          { name: "Lat pulldown", sets_reps: "3×10–12" },
          { name: "Face pull", sets_reps: "3×12–15" },
          { name: "Biceps curl", sets_reps: "3×10–12" },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { name: "Squat", sets_reps: "4×6–8" },
          { name: "Romanian deadlift", sets_reps: "3×8–10" },
          { name: "Leg press", sets_reps: "3×10–12" },
          { name: "Leg curl", sets_reps: "3×12–15" },
          { name: "Calf raise", sets_reps: "3×15" },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    blurb: "Two days, easy to repeat.",
    workouts: [
      {
        name: "Upper",
        exercises: [
          { name: "Bench press", sets_reps: "4×8–10" },
          { name: "Barbell row", sets_reps: "4×8–10" },
          { name: "Shoulder press", sets_reps: "3×10–12" },
          { name: "Lat pulldown", sets_reps: "3×10–12" },
          { name: "Biceps curl", sets_reps: "3×12" },
          { name: "Triceps pushdown", sets_reps: "3×12" },
        ],
      },
      {
        name: "Lower",
        exercises: [
          { name: "Squat", sets_reps: "4×6–8" },
          { name: "Romanian deadlift", sets_reps: "3×8–10" },
          { name: "Leg press", sets_reps: "3×10–12" },
          { name: "Leg curl", sets_reps: "3×12–15" },
          { name: "Calf raise", sets_reps: "3×15" },
        ],
      },
    ],
  },
  {
    id: "full-body",
    name: "Full Body",
    blurb: "Two alternating sessions, everything covered.",
    workouts: [
      {
        name: "Full Body A",
        exercises: [
          { name: "Squat", sets_reps: "4×6–8" },
          { name: "Bench press", sets_reps: "3×8–10" },
          { name: "Barbell row", sets_reps: "3×8–10" },
          { name: "Lateral raise", sets_reps: "3×12–15" },
          { name: "Plank", sets_reps: "3×60s" },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          { name: "Romanian deadlift", sets_reps: "3×8–10" },
          { name: "Shoulder press", sets_reps: "3×8–10" },
          { name: "Lat pulldown", sets_reps: "3×10–12" },
          { name: "Walking lunge", sets_reps: "3×10–12" },
          { name: "Hanging knee raise", sets_reps: "3×12–15" },
        ],
      },
    ],
  },
];

/** Two ready plans that best fit how often someone trains. */
export function fallbackPlans(daysPerWeek: number): Plan[] {
  const firstId = daysPerWeek <= 2 ? "full-body" : daysPerWeek === 4 ? "upper-lower" : "ppl";
  const first = TEMPLATES.find((t) => t.id === firstId) ?? TEMPLATES[0]!;
  const second =
    TEMPLATES.find((t) => t.id !== first.id && t.id !== "full-body") ??
    TEMPLATES.find((t) => t.id !== first.id)!;
  return [first, second];
}

/** The shape create_plan() expects; blank exercise names dropped, no pairing off the end. */
export function toCreatePlanInput(workouts: PlanWorkout[]) {
  return workouts.map((workout) => {
    const exercises = workout.exercises.filter((e) => e.name.trim());
    return {
      name: workout.name.trim(),
      exercises: exercises.map((e, i) => ({
        name: e.name.trim(),
        sets_reps: normalizeSetsReps(e.sets_reps),
        linked_to_next: Boolean(e.linked_to_next) && i < exercises.length - 1,
      })),
    };
  });
}
