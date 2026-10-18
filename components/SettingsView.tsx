"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-workouts";
import { buildExportCsv, deleteAccount, signOut } from "@/lib/account";
import { profileKey } from "@/lib/api/profile";
import { createClient } from "@/lib/supabase/client";
import { getTodayDateString } from "@/lib/utils/date";

const ROW = "block w-full border-b border-border py-4 text-left text-[17px] transition-colors active:bg-secondary";
const HINT = "block text-[13px] text-muted-foreground";

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 shrink-0">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void createClient()
      .auth.getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  async function saveName() {
    const next = name?.trim();
    if (!profile || !next || next === profile.displayName) return;
    const { error } = await createClient().from("profiles").update({ display_name: next }).eq("id", profile.id);
    if (error) setMessage("Couldn't save your name. Try again.");
    else void queryClient.invalidateQueries({ queryKey: profileKey });
  }

  async function exportData() {
    setExporting(true);
    setMessage(null);
    try {
      const csv = await buildExportCsv();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `lift-${getTodayDateString()}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setMessage("Couldn't export your data. Try again.");
    } finally {
      setExporting(false);
    }
  }

  async function leave() {
    await signOut();
    window.location.replace("/auth");
  }

  return (
    <div className="px-6 pb-24 pt-10">
      <Link
        href="/"
        className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground transition-opacity active:opacity-60"
      >
        <ChevronLeft />
        Workouts
      </Link>
      <h1 className="mt-6 text-[28px] font-semibold leading-tight tracking-tight">Settings</h1>
      {email ? <p className="mt-1 text-[13px] text-muted-foreground">Signed in as {email}</p> : null}

      <label className="mt-8 block border-b border-border pb-4">
        <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Your name</span>
        <input
          value={name ?? profile?.displayName ?? ""}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void saveName()}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          maxLength={40}
          placeholder="Your name"
          autoComplete="given-name"
          className="mt-1 w-full bg-transparent text-[17px] outline-none"
        />
      </label>

      <Link href="/onboarding" className={ROW}>
        Build a new plan
        <span className={HINT}>Adds new workouts. Your current ones and their history stay.</span>
      </Link>
      <button type="button" onClick={() => void exportData()} disabled={exporting} className={ROW}>
        {exporting ? "Preparing…" : "Export my data"}
        <span className={HINT}>Every set you&apos;ve logged, as a spreadsheet file.</span>
      </button>
      <Link href="/support" className={ROW}>
        Help &amp; support
      </Link>
      <button type="button" onClick={() => void leave()} className={ROW}>
        Sign out
      </button>

      {message ? <p className="mt-4 text-[13px] text-destructive">{message}</p> : null}

      <DeleteAccount />

      <p className="mt-10 flex gap-4 text-[13px] text-muted-foreground">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </p>
    </div>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    setBusy(true);
    setError(false);
    try {
      await deleteAccount();
      window.location.replace("/auth");
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="mt-12">
      {confirming ? (
        <div className="rounded-xl border border-border p-4">
          <p className="text-[15px]">Delete your account?</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your workouts and every logged set are deleted for good. Export your data first if you want a copy.
          </p>
          <div className="mt-4 flex items-center gap-5">
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="text-[15px] font-medium text-destructive disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete everything"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="text-[15px] text-muted-foreground">
              Cancel
            </button>
          </div>
          {error ? <p className="mt-3 text-[13px] text-destructive">Couldn&apos;t delete your account. Try again.</p> : null}
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-[15px] text-destructive">
          Delete account
        </button>
      )}
    </div>
  );
}
