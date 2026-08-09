"use client";

import { useState } from "react";
import type { WorkoutDetail } from "@/types";
import { ExerciseList } from "@/components/ExerciseList";
import { WorkoutHeader } from "@/components/WorkoutHeader";

type WorkoutViewProps = {
  workout: WorkoutDetail;
};

export function WorkoutView({ workout }: WorkoutViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
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
    </div>
  );
}
