"use client";

import { useEffect, useRef, useState } from "react";
import { BicepLoader } from "@/components/BicepLoader";

type AppSplashProps = {
  isLoading: boolean;
};

const MIN_DISPLAY_MS = 400;
const FILL_DURATION_MS = 650;
const MAX_INDETERMINATE = 0.85;

export function AppSplash({ isLoading }: AppSplashProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(isLoading);
  const [fading, setFading] = useState(false);
  const mountTime = useRef(Date.now());
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!isLoading) return;

    mountTime.current = Date.now();
    startTime.current = Date.now();
    setVisible(true);
    setFading(false);
    setProgress(0);

    let frame: number;
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const t = Math.min(1, elapsed / FILL_DURATION_MS);
      const eased = 1 - (1 - t) ** 2;
      setProgress(eased * MAX_INDETERMINATE);
      if (isLoading && t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const complete = () => {
      setProgress(1);
      setTimeout(() => setFading(true), 80);
      setTimeout(() => setVisible(false), 350);
    };

    const timer = setTimeout(complete, remaining);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-[250ms] ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={fading}
    >
      <BicepLoader progress={progress} size={88} />
    </div>
  );
}
