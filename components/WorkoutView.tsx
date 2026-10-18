"use client";

import { useState } from "react";
import type { WorkoutDetail } from "@/types";
import { DeleteWorkoutButton } from "@/components/DeleteWorkoutButton";
import { ExerciseList } from "@/components/ExerciseList";
import { SaveStatusProvider } from "@/components/SaveStatus";
import { WorkoutHeader } from "@/components/WorkoutHeader";

type WorkoutViewProps = {
  workout: WorkoutDetail;
};

export function WorkoutView({ workout }: WorkoutViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <SaveStatusProvider>
      <div className="px-6 pb-20 pt-10">
        <WorkoutHeader
          workoutId={workout.id}
          name={workout.name}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((current) => !current)}
        />
        <div className="mt-6">
          <ExerciseList
            workoutId={workout.id}
            exercises={workout.exercises}
            isEditing={isEditing}
          />
        </div>
        {isEditing ? <DeleteWorkoutButton workoutId={workout.id} /> : null}
      </div>
    </SaveStatusProvider>
  );
}
