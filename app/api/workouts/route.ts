import { NextResponse } from "next/server";
import { getWorkouts } from "@/lib/db/workouts";

export async function GET() {
  try {
    const workouts = await getWorkouts();
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load workouts" },
      { status: 500 },
    );
  }
}
