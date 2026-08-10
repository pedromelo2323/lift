import { NextResponse } from "next/server";
import { getWorkoutDetail } from "@/lib/db/workouts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const workout = await getWorkoutDetail(id);

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    return NextResponse.json(workout);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load workout" },
      { status: 500 },
    );
  }
}
