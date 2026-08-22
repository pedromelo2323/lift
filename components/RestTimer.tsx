"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PRESETS = [
  { label: "1:00", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2:00", seconds: 120 },
  { label: "3:00", seconds: 180 },
] as const;

/** Comfortable thumb target (~56px). */
const FAB_SIZE = "h-14 w-14";

function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new Ctx();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/** Unlock audio on a user gesture so the finish chime works on iOS. */
async function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
}

function playDoneChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().then(() => {
    const now = ctx.currentTime;
    // Three rising notes — clearer than a short blip, still soft.
    const notes = [
      { freq: 659.25, at: 0, dur: 0.18 },
      { freq: 830.61, at: 0.14, dur: 0.18 },
      { freq: 1046.5, at: 0.28, dur: 0.32 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      const t0 = now + note.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + note.dur + 0.02);
    }
  });
}

function notifyTimerDone() {
  playDoneChime();
  try {
    // iOS ignores vibrate; Android gets a clear pattern.
    navigator.vibrate?.([120, 70, 120, 70, 220]);
  } catch {
    // ignore
  }
}

function StopwatchIcon() {
  return (
    <svg
      width="24"
      height="24"
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

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
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

  const cancelTimer = useCallback(() => {
    setEndAt(null);
    setJustFinished(false);
    finishedForRef.current = null;
    closePicker();
  }, [closePicker]);

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
    notifyTimerDone();
    const timeout = window.setTimeout(() => setJustFinished(false), 1800);
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
    void unlockAudio();
    finishedForRef.current = null;
    setJustFinished(false);
    setEndAt(Date.now() + seconds * 1000);
    setNow(Date.now());
    closePicker();
  }

  function handleMainClick() {
    if (running || justFinished) return;
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
    void unlockAudio();
  }

  // Sit above the larger bug FAB with a comfortable gap.
  const fabBottom = "calc(1.25rem + 4.5rem + env(safe-area-inset-bottom))";
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
                className={`rest-timer-pill flex h-11 min-w-[56px] items-center justify-center rounded-full bg-background px-4 text-[14px] font-medium tabular-nums text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] ${
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

        <div className="flex items-center gap-2">
          {(running || justFinished) && (
            <button
              type="button"
              onClick={cancelTimer}
              aria-label="Cancel rest timer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-transform duration-200 active:scale-95"
            >
              <CloseIcon />
            </button>
          )}

          <button
            type="button"
            onClick={handleMainClick}
            aria-label={
              running
                ? `Rest timer ${formatRemaining(remaining)}`
                : pickerOpen
                  ? "Close rest timer"
                  : "Start rest timer"
            }
            className={`flex ${FAB_SIZE} items-center justify-center rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-[transform,background-color,color] duration-200 active:scale-95 ${
              running || justFinished
                ? "bg-foreground text-background"
                : "bg-background text-foreground"
            }`}
          >
            {running || justFinished ? (
              <span className="text-[15px] font-medium tabular-nums">
                {justFinished ? "0:00" : formatRemaining(remaining)}
              </span>
            ) : (
              <StopwatchIcon />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
