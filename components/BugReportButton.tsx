"use client";

import { useEffect, useRef, useState } from "react";
import {
  createBugReport,
  deleteBugReport,
  getBugReports,
  toggleBugResolved,
} from "@/lib/actions/bugs";
import type { BugKind, BugReport } from "@/types/bugs";

function BugIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v2" />
      <path d="M16 2v2" />
      <path d="M12 2v2" />
      <path d="M12 22v-2" />
      <path d="M8 22v-2" />
      <path d="M16 22v-2" />
      <path d="M7 8H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
      <path d="M17 8h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      <path d="M12 8v8" />
      <path d="M9 12H7" />
      <path d="M17 12h-2" />
      <path d="M9 16H7" />
      <path d="M17 16h-2" />
    </svg>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<BugKind>("bug");
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    setLoading(true);
    getBugReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, [open]);

  async function submit() {
    const text = body.trim();
    if (!text || saving) return;

    setSaving(true);
    const result = await createBugReport(text, kind);
    setSaving(false);

    if (!result.error) {
      setBody("");
      const next = await getBugReports();
      setReports(next);
    }
  }

  async function handleToggle(id: string, resolved: boolean) {
    await toggleBugResolved(id, resolved);
    setReports(await getBugReports());
  }

  async function handleDelete(id: string) {
    await deleteBugReport(id);
    setReports(await getBugReports());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a bug or idea"
        className="fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform duration-200 active:scale-95"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <BugIcon />
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
            className="relative max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background px-5 pt-5"
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
                  className={`rounded-full px-3 py-1 text-xs capitalize transition-colors duration-200 ${
                    kind === k
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground"
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
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-border"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim() || saving}
              className="mt-2 w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>

            <ul className="mt-6 space-y-1 border-t border-border pt-4">
              {loading && (
                <li className="py-6 text-center text-sm text-muted-foreground">Loading…</li>
              )}
              {!loading && reports.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  Nothing logged yet.
                </li>
              )}
              {reports.map((report) => (
                <li key={report.id} className="flex items-start gap-3 py-2">
                  <button
                    type="button"
                    aria-label={report.resolved ? "Mark as open" : "Mark as done"}
                    onClick={() => handleToggle(report.id, !report.resolved)}
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                      report.resolved ? "border-foreground bg-foreground" : "border-border"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        report.resolved
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {report.body}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {report.kind} · {formatWhen(report.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => handleDelete(report.id)}
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
