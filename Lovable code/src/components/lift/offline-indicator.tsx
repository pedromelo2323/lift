import { useEffect, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";

/** Quiet line at the top when there is no connection or writes are queued. */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const pending = useIsMutating();

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-[env(safe-area-inset-top)]">
      <span className="mt-2 rounded-full bg-secondary px-3 py-1 text-[11px] tracking-wide text-muted-foreground">
        {online ? "Saving…" : "Offline — saved on this phone"}
      </span>
    </div>
  );
}
