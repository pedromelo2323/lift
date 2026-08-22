"use client";

import { useCallback, useEffect, useRef } from "react";

type DebouncedFn<T extends (...args: never[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  flush: () => void;
};

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delayMs = 400,
): DebouncedFn<T> {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  callbackRef.current = callback;

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const args = lastArgsRef.current;
    if (!args) return;
    lastArgsRef.current = null;
    callbackRef.current(...args);
  }, []);

  const run = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        const pending = lastArgsRef.current;
        lastArgsRef.current = null;
        if (pending) callbackRef.current(...pending);
      }, delayMs);
    },
    [delayMs],
  );

  const debounced = run as DebouncedFn<T>;
  debounced.flush = flush;

  useEffect(() => () => flush(), [flush]);

  return debounced;
}
