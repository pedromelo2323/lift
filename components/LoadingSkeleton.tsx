export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-10 space-y-px">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-[57px] animate-pulse border-b border-border" />
      ))}
    </div>
  );
}

export function WorkoutSkeleton() {
  return (
    <div className="mt-6 space-y-px">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-[52px] animate-pulse border-b border-border" />
      ))}
    </div>
  );
}
