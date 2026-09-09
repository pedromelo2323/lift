"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

type SaveStatusValue = {
  state: SaveState;
  markDirty: () => void;
  track: <T>(task: () => Promise<T>) => Promise<T>;
  retry: () => void;
};

const SaveStatusContext = createContext<SaveStatusValue | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SaveState>("idle");
  const pendingRef = useRef(0);
  const failedRef = useRef(false);
  const retryRef = useRef<(() => Promise<unknown>) | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  }, []);

  const markDirty = useCallback(() => {
    clearIdleTimer();
    failedRef.current = false;
    setState("saving");
  }, [clearIdleTimer]);

  const track = useCallback(
    async <T,>(task: () => Promise<T>): Promise<T> => {
      clearIdleTimer();
      retryRef.current = task;
      failedRef.current = false;
      pendingRef.current += 1;
      setState("saving");

      try {
        const result = await task();
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        if (pendingRef.current === 0 && !failedRef.current) {
          retryRef.current = null;
          setState("saved");
          idleTimerRef.current = setTimeout(() => setState("idle"), 1400);
        }
        return result;
      } catch (error) {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        failedRef.current = true;
        retryRef.current = task;
        setState("error");
        throw error;
      }
    },
    [clearIdleTimer],
  );

  const retry = useCallback(() => {
    const task = retryRef.current;
    if (!task) return;
    void track(task).catch(() => {
      // Keep the persistent error state until a retry succeeds.
    });
  }, [track]);

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer]);

  return (
    <SaveStatusContext.Provider value={{ state, markDirty, track, retry }}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  const value = useContext(SaveStatusContext);
  if (!value) {
    throw new Error("useSaveStatus must be used inside SaveStatusProvider");
  }
  return value;
}
