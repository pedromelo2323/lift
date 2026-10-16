import { useEffect, useState } from "react";
import { X } from "lucide-react";

const key = (id: string) => `lift.hint.${id}`;

export function dismissHint(id: string) {
  try {
    localStorage.setItem(key(id), "1");
    window.dispatchEvent(new CustomEvent("lift-hint", { detail: id }));
  } catch {
    /* ignore */
  }
}

/** A quiet, one-time tip. Disappears forever once dismissed or once the action is done. */
export function FirstHint({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(key(id)));
    } catch {
      setShow(false);
    }
    const onHint = (e: Event) => (e as CustomEvent).detail === id && setShow(false);
    window.addEventListener("lift-hint", onHint);
    return () => window.removeEventListener("lift-hint", onHint);
  }, [id]);

  if (!show) return null;
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-border px-3.5 py-2.5 text-[13px] text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300 ${className ?? ""}`}
    >
      <span className="flex-1 leading-snug">{children}</span>
      <button type="button" aria-label="Dismiss tip" onClick={() => dismissHint(id)} className="-m-1 p-1 text-muted-foreground/60">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
