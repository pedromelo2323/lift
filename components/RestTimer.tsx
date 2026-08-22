"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

function StopwatchIcon() {
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
      <path d="M10 2h4" />
      <path d="M12 2v3" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 10v4l2.5 1.5" />
    </svg>
  );
}

export function RestTimer() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [justFinished, setJustFinished] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const finishedForRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerOpenRef = useRef(false);

  const remaining = endAt == null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000));
  const running = endAt != null && remaining > 0;
  const showPresets = pickerOpen || leaving;
  pickerOpenRef.current = pickerOpen;

  const closePicker = useCallback(() => {
    if (!pickerOpenRef.current) return;
    setPickerOpen(false);
    setLeaving(true);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      setLeaving(false);
      leaveTimeoutRef.current = null;
    }, 220);
  }, []);

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
    closePicker();
    playDoneChime();
    try {
      navigator.vibrate?.([160, 80, 160]);
    } catch {
      // ignore
    }
    const timeout = window.setTimeout(() => setJustFinished(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [closePicker, endAt, remaining]);

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
        // Wake Lock is optional.
      });
    return () => {
      cancelled = true;
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [running]);

  useEffect(
    () => () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    },
    [],
  );

  function start(seconds: number) {
    finishedForRef.current = null;
    setJustFinished(false);
    setEndAt(Date.now() + seconds * 1000);
    setNow(Date.now());
    closePicker();
  }

  function handleMainClick() {
    if (running) {
      setEndAt(null);
      closePicker();
      return;
    }
    if (pickerOpen) {
      closePicker();
      return;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setLeaving(false);
    setPickerOpen(true);
  }

  const fabBottom = "calc(1.25rem + 3.75rem + env(safe-area-inset-bottom))";
  const orderedPresets = [...PRESETS].reverse();

  return (
    <>
      {pickerOpen && (
        <button
          type="button"
          aria-label="Close timer options"
          onClick={closePicker}
          className="fixed inset-0 z-40"
        />
      )}

      <div
        className="fixed right-5 z-40 flex flex-col items-end gap-2.5"
        style={{ bottom: fabBottom }}
      >
        {showPresets &&
          orderedPresets.map((preset, index) => {
            const fromBottom = index;
            const fromTop = orderedPresets.length - 1 - index;
            return (
              <button
                key={preset.seconds}
                type="button"
                onClick={() => start(preset.seconds)}
                className={`rest-timer-pill flex h-10 min-w-[52px] items-center justify-center rounded-full bg-background px-3.5 text-[13px] font-medium tabular-nums text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] ${
                  leaving ? "rest-timer-pill-out" : "rest-timer-pill-in"
                }`}
                style={{
                  animationDelay: leaving
                    ? `${fromTop * 30}ms`
                    : `${fromBottom * 45}ms`,
                }}
              >
                {preset.label}
              </button>
            );
          })}

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
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-[transform,background-color,color] duration-200 active:scale-95 ${
            running || justFinished
              ? "bg-foreground text-background"
              : "bg-background text-foreground"
          }`}
        >
          {running || justFinished ? (
            <span className="text-[13px] font-medium tabular-nums">
              {justFinished ? "0:00" : formatRemaining(remaining)}
            </span>
          ) : (
            <StopwatchIcon />
          )}
        </button>
      </div>
    </>
  );
}
