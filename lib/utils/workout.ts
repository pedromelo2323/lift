export function formatRepRange(setsReps: string | null): string {
  if (!setsReps) return "";

  const match = setsReps.match(/[×x*]\s*([\d–\-]+(?:s\b)?(?:\/[\w]+)?)/);
  if (match) {
    return match[1].replace(/-/g, "–");
  }

  return setsReps;
}

/** Tidies typed sets × reps ("3x8-10" → "3×8–10"). Empty input clears it. */
export function normalizeSetsReps(input: string): string | null {
  const tidy = input
    .trim()
    .replace(/\s*[xX*×]\s*/, "×")
    .replace(/\s*-\s*/g, "–")
    .replace(/\s+/g, " ")
    .slice(0, 20);
  return tidy || null;
}
