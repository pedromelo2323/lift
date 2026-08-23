"use client";

type UndoToastProps = {
  message: string;
  onUndo: () => void;
};

export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div
      className="fixed inset-x-4 z-50 flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-background shadow-lg"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      role="status"
    >
      <p className="min-w-0 flex-1 text-[14px] leading-snug">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 text-[14px] font-medium underline-offset-2 active:opacity-70"
      >
        Undo
      </button>
    </div>
  );
}
