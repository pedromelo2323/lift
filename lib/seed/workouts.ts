export type SeedExercise = {
  name: string;
  setsReps: string;
  sortOrder: number;
};

export type SeedWorkout = {
  name: string;
  exercises: SeedExercise[];
};

export const SEED_WORKOUTS: SeedWorkout[] = [
  {
    name: "Push3",
    exercises: [
      { name: "Incline Bench Press", setsReps: "4×6–8", sortOrder: 1 },
      { name: "Dips", setsReps: "3×8–12", sortOrder: 2 },
      { name: "Chest Fly", setsReps: "3×12–15", sortOrder: 3 },
      { name: "Behind Head Tricep", setsReps: "3×10–12", sortOrder: 4 },
      { name: "Tricep Cable Pushdowns", setsReps: "3×10/side", sortOrder: 5 },
    ],
  },
  {
    name: "Pull3",
    exercises: [
      { name: "Pull Ups (open form)", setsReps: "4×8–10", sortOrder: 1 },
      { name: "Lat Pulldown", setsReps: "3×8–10", sortOrder: 2 },
      { name: "Seated Horizontal Row", setsReps: "3×10–12", sortOrder: 3 },
      { name: "Standing Lat Pushdown", setsReps: "3×10–12", sortOrder: 4 },
      { name: "Bicep Curls", setsReps: "3×10", sortOrder: 5 },
    ],
  },
  {
    name: "Legs3",
    exercises: [
      { name: "Landmine Snatch", setsReps: "3×8–10", sortOrder: 1 },
      { name: "Shoulder Press", setsReps: "3×10–12", sortOrder: 2 },
      { name: "Walking Lunges", setsReps: "3×15–20", sortOrder: 3 },
      { name: "Leg Extension", setsReps: "3×12–15", sortOrder: 4 },
      { name: "Lateral Raises", setsReps: "3×10/side", sortOrder: 5 },
    ],
  },
];
