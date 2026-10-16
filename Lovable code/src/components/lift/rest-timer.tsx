import { Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRESETS = [60, 90, 120, 180];

function format(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RestTimer() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (remaining === null) return;
    const id = window.setInterval(() => {
      if (endRef.current === null) return;
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        endRef.current = null;
        window.clearInterval(id);
        if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [remaining === null]);

  const start = (seconds: number) => {
    endRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setOpen(false);
  };

  const running = remaining !== null;

  return (
    <div
      className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      {open &&
        PRESETS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => start(seconds)}
            className="animate-in fade-in slide-in-from-bottom-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-md transition-transform active:scale-95"
          >
            {format(seconds)}
          </button>
        ))}

      <div className="flex items-center gap-2">
        {running && (
          <button
            type="button"
            aria-label="Cancel timer"
            onClick={() => {
              endRef.current = null;
              setRemaining(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={running ? `Rest timer ${format(remaining!)}` : "Start rest timer"}
          className={`flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card shadow-lg transition-transform active:scale-95 ${
            running ? "px-4" : "w-12"
          } ${remaining === 0 ? "text-primary" : "text-foreground"}`}
        >
          <Timer size={20} strokeWidth={1.75} />
          {running && (
            <span className="tabular-nums text-[15px] font-medium">{format(remaining!)}</span>
          )}
        </button>
      </div>
    </div>
  );
}
