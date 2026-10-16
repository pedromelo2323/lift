import { useEffect, useState } from "react";

const KEY = "lift:install-dismissed";

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && safari;
}

/** One quiet line telling iPhone users how to keep Lift on the home screen. */
export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (!isIosSafari()) return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="mt-8 border-b border-border pb-5">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Keep Lift one tap away: Share, then Add to Home Screen.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(KEY, "1");
          setShow(false);
        }}
        className="mt-2 text-[13px] text-muted-foreground/60"
      >
        Dismiss
      </button>
    </div>
  );
}
