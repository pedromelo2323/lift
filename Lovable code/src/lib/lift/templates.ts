export type Template = {
  id: string;
  name: string;
  blurb: string;
  workouts: { name: string; exercises: { name: string; target_reps?: string; linked_to_next?: boolean }[] }[];
};

export const TEMPLATES: Template[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    blurb: "Three days, classic split.",
    workouts: [
      {
        name: "Push",
        exercises: [
          { name: "Bench press", target_reps: "8–10" },
          { name: "Incline dumbbell press", target_reps: "10–12" },
          { name: "Shoulder press", target_reps: "8–10" },
          { name: "Lateral raise", target_reps: "12–15" },
          { name: "Triceps pushdown", target_reps: "12–15" },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { name: "Pull-up", target_reps: "6–10" },
          { name: "Barbell row", target_reps: "8–10" },
          { name: "Lat pulldown", target_reps: "10–12" },
          { name: "Face pull", target_reps: "12–15" },
          { name: "Biceps curl", target_reps: "10–12" },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { name: "Squat", target_reps: "6–8" },
          { name: "Romanian deadlift", target_reps: "8–10" },
          { name: "Leg press", target_reps: "10–12" },
          { name: "Leg curl", target_reps: "12–15" },
          { name: "Calf raise", target_reps: "15" },
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
          { name: "Bench press", target_reps: "8–10" },
          { name: "Barbell row", target_reps: "8–10" },
          { name: "Shoulder press", target_reps: "10–12" },
          { name: "Lat pulldown", target_reps: "10–12" },
          { name: "Biceps curl", target_reps: "12" },
          { name: "Triceps pushdown", target_reps: "12" },
        ],
      },
      {
        name: "Lower",
        exercises: [
          { name: "Squat", target_reps: "6–8" },
          { name: "Romanian deadlift", target_reps: "8–10" },
          { name: "Leg press", target_reps: "10–12" },
          { name: "Leg curl", target_reps: "12–15" },
          { name: "Calf raise", target_reps: "15" },
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
          { name: "Squat", target_reps: "6–8" },
          { name: "Bench press", target_reps: "8–10" },
          { name: "Barbell row", target_reps: "8–10" },
          { name: "Lateral raise", target_reps: "12–15" },
          { name: "Plank", target_reps: "60s" },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          { name: "Romanian deadlift", target_reps: "8–10" },
          { name: "Shoulder press", target_reps: "8–10" },
          { name: "Lat pulldown", target_reps: "10–12" },
          { name: "Walking lunge", target_reps: "10–12" },
          { name: "Hanging knee raise", target_reps: "12–15" },
        ],
      },
    ],
  },
];
