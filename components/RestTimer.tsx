"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [
  { label: "1:00", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2:00", seconds: 120 },
  { label: "3:00", seconds: 180 },
] as const;

function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function playDoneChime() {
  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    for (const [i, freq] of [880, 1174].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02 + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + i * 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + 0.22 + i * 0.12);
    }
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    // Audio is optional.
  }
}

function ClockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function RestTimer() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [justFinished, setJustFinished] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const finishedForRef = useRef<number | null>(null);

  const remaining =
    endAt == null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000));
  const running = endAt != null && remaining > 0;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (endAt == null || remaining > 0) return;
    if (finishedForRef.current === endAt) return;
    finishedForRef.current = endAt;
    setEndAt(null);
    setJustFinished(true);
    setPickerOpen(false);
    playDoneChime();
    try {
      navigator.vibrate?.([160, 80, 160]);
    } catch {
      // ignore
    }
    const timeout = window.setTimeout(() => setJustFinished(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [endAt, remaining]);

  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let cancelled = false;
    void navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) {
          void lock.release();
          return;
        }
        wakeLockRef.current = lock;
      })
      .catch(() => {
        // Wake Lock is optional (unsupported / battery saver).
      });
    return () => {
      cancelled = true;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [running]);

  function start(seconds: number) {
    finishedForRef.current = null;
    setJustFinished(false);
    setEndAt(Date.now() + seconds * 1000);
    setNow(Date.now());
    setPickerOpen(false);
  }

  function handleMainClick() {
    if (running) {
      setEndAt(null);
      setPickerOpen(false);
      return;
    }
    setPickerOpen((open) => !open);
  }

  const fabBottom = "calc(1.25rem + 3.75rem + env(safe-area-inset-bottom))";

  return (
    <>
      {pickerOpen && (
        <button
          type="button"
          aria-label="Close timer options"
          onClick={() => setPickerOpen(false)}
          className="fixed inset-0 z-40"
        />
      )}

      <div className="fixed right-5 z-40 flex flex-col items-center gap-2" style={{ bottom: fabBottom }}>
        {pickerOpen &&
          [...PRESETS].reverse().map((preset, index) => (
            <button
              key={preset.seconds}
              type="button"
              onClick={() => start(preset.seconds)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-[13px] font-medium tabular-nums text-background shadow-lg transition-transform duration-200 active:scale-95"
              style={{
                animation: `rest-timer-pop 180ms ease-out ${index * 35}ms both`,
              }}
            >
              {preset.label}
            </button>
          ))}

        <button
          type="button"
          onClick={handleMainClick}
          aria-label={
            running
              ? `Rest timer ${formatRemaining(remaining)}, tap to cancel`
              : pickerOpen
                ? "Close rest timer"
                : "Start rest timer"
          }
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-200 active:scale-95 ${
            running || justFinished
              ? "bg-foreground text-background"
              : pickerOpen
                ? "bg-secondary text-foreground"
                : "bg-foreground text-background"
          }`}
        >
          {running || justFinished ? (
            <span className="text-[13px] font-medium tabular-nums">
              {justFinished ? "0:00" : formatRemaining(remaining)}
            </span>
          ) : (
            <ClockIcon />
          )}
        </button>
      </div>
    </>
  );
}
