export function formatRepRange(setsReps: string | null): string {
  if (!setsReps) return "";

  const match = setsReps.match(/[×x*]\s*([\d–\-]+(?:\/[\w]+)?)/);
  if (match) {
    return match[1].replace(/-/g, "–");
  }

  return setsReps;
}
