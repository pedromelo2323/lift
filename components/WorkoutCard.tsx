import Link from "next/link";
import type { WorkoutWithMeta } from "@/types";
import { formatLastCompleted } from "@/lib/utils/date";

type WorkoutCardProps = {
  workout: WorkoutWithMeta;
};

export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <Link
      href={`/workout/${workout.id}`}
      className="block rounded-2xl border border-[#E5E5EA] bg-white px-5 py-4 transition-colors duration-200 active:bg-[#F5F5F7]"
    >
      <p className="text-[17px] font-medium tracking-[-0.02em] text-[#1D1D1F]">
        {workout.name}
      </p>
      <p className="mt-1 text-[15px] text-[#86868B]">
        {formatLastCompleted(workout.last_completed_date)}
      </p>
    </Link>
  );
}
