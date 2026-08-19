"use client";

import type { CSSProperties } from "react";

type BicepLoaderProps = {
  progress: number;
  size?: number;
  className?: string;
};

const FLEXED_BICEPS = "\u{1F4AA}";

/** The 💪 emoji rendered monochrome gray, filling in from the bottom as progress rises. */
export function BicepLoader({ progress, size = 88, className }: BicepLoaderProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const pct = clamped * 100;
  // Feathered edge so the fill reads as a level rising, not a hard bar.
  const mask = `linear-gradient(to top, #000 ${pct - 6}%, transparent ${pct + 6}%)`;

  const glyph: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
    fontSize: size,
    lineHeight: 1,
    filter: "grayscale(1) brightness(0.45) contrast(1.15)",
    userSelect: "none",
  };

  return (
    <div
      className={className}
      style={{ position: "relative", width: size * 1.15, height: size * 1.15 }}
      aria-hidden
    >
      <div style={{ ...glyph, opacity: 0.14 }}>{FLEXED_BICEPS}</div>
      <div
        style={{
          ...glyph,
          opacity: 0.95,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {FLEXED_BICEPS}
      </div>
    </div>
  );
}
