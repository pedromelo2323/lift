import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecap } from "@/lib/lift/recap";
import { toDisplayWeight, unitLabel, usePrefs } from "@/lib/lift/prefs";

const KEY = "lift:recap-dismissed";

export function WeeklyRecap() {
  usePrefs();
  const { data } = useQuery({ queryKey: ["recap"], queryFn: fetchRecap });
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(KEY) === new Date().toISOString().slice(0, 10));
  }, []);

  if (!data || dismissed || data.sessions === 0) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    setDismissed(true);
  };

  return (
    <div className="mt-8 border-b border-border pb-5">
      <p className="text-[15px] leading-relaxed">
        {data.sessions} {data.sessions === 1 ? "session" : "sessions"} this week
        {data.heavier > 0
          ? `, and you went heavier on ${data.heavier} ${
              data.heavier === 1 ? "exercise" : "exercises"
            }.`
          : "."}
      </p>
      {data.sinceStart ? (
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Since you started: {data.sinceStart.name} {toDisplayWeight(data.sinceStart.from)} →{" "}
          {toDisplayWeight(data.sinceStart.to)} {unitLabel()}, across {data.totalSessions} sessions.
        </p>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        className="mt-2 text-[13px] text-muted-foreground/60"
      >
        Dismiss
      </button>
    </div>
  );
}
