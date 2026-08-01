export function formatSessionDate(dateStr: string, isToday = false): string {
  if (isToday) return "Today";

  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLastCompleted(dateStr: string | null): string {
  if (!dateStr) return "Not yet logged";

  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSetValue(weight: number | null, reps: number | null): string {
  if (weight == null && reps == null) return "—";
  if (weight == null) return `${reps ?? 0}`;
  if (reps == null) return `${weight}×—`;
  return `${weight}×${reps}`;
}

export function parseSetValue(value: string): { weight: number | null; reps: number | null } {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—") {
    return { weight: null, reps: null };
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+)$/i);
  if (match) {
    return { weight: Number(match[1]), reps: Number(match[2]) };
  }

  const num = Number(trimmed);
  if (!Number.isNaN(num)) {
    return { weight: null, reps: num };
  }

  return { weight: null, reps: null };
}
