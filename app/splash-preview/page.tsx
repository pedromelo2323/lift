"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BicepLoader } from "@/components/BicepLoader";

/** Dev preview — replay or scrub the bicep fill animation. */
export default function SplashPreviewPage() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const frame = useRef<number>(0);

  const play = useCallback(() => {
    setPlaying(true);
    setProgress(0);
    const start = Date.now();
    const duration = 650;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - t) ** 2;
      setProgress(t < 1 ? eased * 0.85 : 1);
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    play();
    return () => cancelAnimationFrame(frame.current);
  }, [play]);

  const scrub = (value: number) => {
    cancelAnimationFrame(frame.current);
    setPlaying(false);
    setProgress(value);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <BicepLoader progress={progress} size={88} />

      <button
        type="button"
        onClick={play}
        disabled={playing}
        className="mt-10 text-[15px] text-muted-foreground disabled:opacity-40"
      >
        Replay
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(progress * 100)}
        onChange={(e) => scrub(Number(e.target.value) / 100)}
        className="mt-8 w-56"
        aria-label="Fill progress"
      />
    </div>
  );
}
