"use client";

import { useRef, useState, type ReactNode } from "react";

const ACTION_WIDTH = 72;
const OPEN_THRESHOLD = 40;

type SwipeDeleteRowProps = {
  children: ReactNode;
  disabled?: boolean;
  onDelete: () => void;
};

export function SwipeDeleteRow({ children, disabled, onDelete }: SwipeDeleteRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axis = useRef<"x" | "y" | null>(null);
  const dragging = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return;
    dragging.current = true;
    axis.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || disabled) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!axis.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (axis.current !== "x") return;

    const next = Math.min(0, Math.max(-ACTION_WIDTH, startOffset.current + dx));
    setOffset(next);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (axis.current === "x") {
      setOffset((current) => (current < -OPEN_THRESHOLD ? -ACTION_WIDTH : 0));
    }
    axis.current = null;
  }

  if (disabled) return <>{children}</>;

  return (
    <div className="relative overflow-hidden border-t border-border">
      <button
        type="button"
        aria-label="Delete session"
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-destructive text-background"
      >
        <TrashIcon />
      </button>
      <div
        className="relative bg-background touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform 180ms ease-out",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
