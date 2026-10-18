"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "lift:install-dismissed";

type InstallEvent = Event & { prompt: () => Promise<void> };

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function wasDismissed() {
  try {
    return Boolean(localStorage.getItem(DISMISSED_KEY));
  } catch {
    return false;
  }
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Share"
      className="mx-0.5 inline -translate-y-px"
    >
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

/** One quiet line telling phone users how to keep Lift on the home screen. */
export function InstallHint() {
  const [mode, setMode] = useState<"ios" | "android" | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (wasDismissed() || isStandalone()) return;
    if (isIosSafari()) {
      setMode("ios");
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Hidden for this visit only.
    }
    setMode(null);
  }

  if (!mode) return null;

  return (
    <div className="mt-10 rounded-xl border border-border px-4 py-3.5">
      <p className="text-[15px]">Keep Lift on your home screen</p>
      {mode === "ios" ? (
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
          Tap <ShareIcon /> in Safari, then <span className="text-foreground">Add to Home Screen</span>. It opens like
          an app.
        </p>
      ) : (
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
          Install it and it opens like an app.
        </p>
      )}
      <div className="mt-2 flex gap-5 text-[13px]">
        {mode === "android" && installEvent ? (
          <button
            type="button"
            onClick={() => void installEvent.prompt().finally(dismiss)}
            className="font-medium text-foreground"
          >
            Install
          </button>
        ) : null}
        <button type="button" onClick={dismiss} className="text-muted-foreground">
          {mode === "ios" ? "Got it" : "Not now"}
        </button>
      </div>
    </div>
  );
}
