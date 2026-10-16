import { Bug } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBugMutations, useBugReports } from "@/hooks/use-bugs";
import type { BugKind } from "@/lib/lift/bugs";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<BugKind>("bug");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: reports } = useBugReports();
  const { create, toggle, remove } = useBugMutations();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    await create.mutateAsync({ body: text, kind });
    setBody("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a bug or idea"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <Bug size={20} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
          />
          <div
            className="relative max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card px-5 pt-5"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Notes & bugs</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground"
              >
                Done
              </button>
            </div>

            <div className="mb-2 flex gap-2">
              {(["bug", "idea"] as BugKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                    kind === k
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={kind === "bug" ? "What went wrong?" : "What's the idea?"}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim() || create.isPending}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {create.isPending ? "Saving…" : "Save"}
            </button>

            <ul className="mt-6 space-y-1 border-t border-border pt-4">
              {(reports ?? []).length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  Nothing logged yet.
                </li>
              )}
              {(reports ?? []).map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-2">
                  <button
                    type="button"
                    aria-label={r.resolved ? "Mark as open" : "Mark as done"}
                    onClick={() => toggle.mutate({ id: r.id, resolved: !r.resolved })}
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                      r.resolved ? "border-primary bg-primary" : "border-border"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        r.resolved ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {r.body}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.kind} · {formatWhen(r.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => remove.mutate(r.id)}
                    className="shrink-0 px-1 text-sm text-muted-foreground"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
