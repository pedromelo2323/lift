import type { SetEntry } from "@/types";

const PREFIX = "lift:session-draft:";

type SessionDraft = {
  sets: SetEntry[];
  updatedAt: number;
};

function key(exerciseId: string, sessionDate: string) {
  return `${PREFIX}${exerciseId}:${sessionDate}`;
}

export function readSessionDraft(exerciseId: string, sessionDate: string): SessionDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(exerciseId, sessionDate));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionDraft;
    if (!Array.isArray(parsed.sets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionDraft(exerciseId: string, sessionDate: string, sets: SetEntry[]) {
  if (typeof window === "undefined") return;
  try {
    const draft: SessionDraft = { sets, updatedAt: Date.now() };
    localStorage.setItem(key(exerciseId, sessionDate), JSON.stringify(draft));
  } catch {
    // Ignore quota / private mode failures; network save is still attempted.
  }
}

export function clearSessionDraft(exerciseId: string, sessionDate: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key(exerciseId, sessionDate));
  } catch {
    // ignore
  }
}
