"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-6 pb-20 pt-24">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Something went wrong</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Your logged sets are safe. Try again.</p>
      <div className="mt-8 flex items-center gap-5">
        <button type="button" onClick={reset} className="text-[15px] font-medium text-foreground active:opacity-60">
          Try again
        </button>
        {/* A full reload, so a broken client state can't follow the user home. */}
        <button type="button" onClick={() => window.location.assign("/")} className="text-[15px] text-muted-foreground">
          Back to workouts
        </button>
      </div>
    </div>
  );
}
