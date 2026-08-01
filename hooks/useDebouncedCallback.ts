import { useCallback, useRef } from "react";

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delayMs = 400,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delayMs);
    },
    [callback, delayMs],
  );
}
