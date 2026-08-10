export const workoutsKey = ["workouts"] as const;
export const workoutKey = (id: string) => ["workout", id] as const;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchWorkouts() {
  return fetchJson<Awaited<ReturnType<typeof import("@/lib/db/workouts").getWorkouts>>>(
    "/api/workouts",
  );
}

export async function fetchWorkoutDetail(id: string) {
  return fetchJson<NonNullable<Awaited<ReturnType<typeof import("@/lib/db/workouts").getWorkoutDetail>>>>(
    `/api/workouts/${id}`,
  );
}
