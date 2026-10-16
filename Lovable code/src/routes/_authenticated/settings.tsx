import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setPrefs, usePrefs, type Theme, type Unit } from "@/lib/lift/prefs";
import { buildExportCsv, fetchProfile, updateDisplayName } from "@/lib/lift/account";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/lift/account.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lift" },
      { name: "description", content: "Your name, your data export, and sign out." },
      { property: "og:title", content: "Settings — Lift" },
      { property: "og:description", content: "Your name, your data export, and sign out." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [name, setName] = useState<string | null>(null);
  const value = name ?? profile?.display_name ?? "";
  const prefs = usePrefs();

  const exportCsv = async () => {
    const csv = await buildExportCsv();
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lift-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
    navigate({ to: "/", replace: true });
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteFn = useServerFn(deleteMyAccount);
  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteFn();
      await signOut();
    } catch {
      setDeleteError("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-20 pt-10">
      <Link
        to="/home"
        className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Home
      </Link>

      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">Settings</h1>

      <div className="mt-8">
        <label className="block border-b border-border pb-4">
          <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
            Name
          </span>
          <input
            value={value}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => value.trim() && updateDisplayName(value.trim())}
            placeholder="Your name"
            className="mt-1 w-full bg-transparent text-[17px] outline-none"
          />
        </label>

        <Choice
          label="Units"
          value={prefs.unit}
          options={[
            ["kg", "kg"],
            ["lb", "lb"],
          ]}
          onChange={(unit) => setPrefs({ unit: unit as Unit })}
        />
        <Choice
          label="Appearance"
          value={prefs.theme}
          options={[
            ["system", "Auto"],
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
          onChange={(theme) => setPrefs({ theme: theme as Theme })}
        />

        <button
          type="button"
          onClick={exportCsv}
          className="block w-full border-b border-border py-4 text-left text-[17px]"
        >
          Export my data
          <span className="block text-[13px] text-muted-foreground">
            Every logged set as a spreadsheet file.
          </span>
        </button>

        <Link to="/onboarding" className="block w-full border-b border-border py-4 text-left text-[17px]">
          Replay onboarding
          <span className="block text-[13px] text-muted-foreground">
            Walk through the setup again. Your workouts stay as they are.
          </span>
        </Link>

        <a href="/support" className="block w-full border-b border-border py-4 text-[17px]">
          Help & contact
        </a>
        <a href="/privacy" className="block w-full border-b border-border py-4 text-[17px]">
          Privacy Policy
        </a>
        <a href="/terms" className="block w-full border-b border-border py-4 text-[17px]">
          Terms of Use
        </a>

        <button
          type="button"
          onClick={signOut}
          className="block w-full border-b border-border py-4 text-left text-[17px] text-destructive"
        >
          Sign out
        </button>

        {confirmDelete ? (
          <div className="py-4">
            <p className="text-[15px]">Delete your account and every logged set? This can't be undone.</p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={deleteAccount}
                className="rounded-lg bg-destructive px-4 py-2 text-[15px] font-medium text-destructive-foreground disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-4 py-2 text-[15px] text-muted-foreground"
              >
                Cancel
              </button>
            </div>
            {deleteError ? <p className="mt-2 text-[13px] text-destructive">{deleteError}</p> : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="block w-full py-4 text-left text-[15px] text-muted-foreground"
          >
            Delete account
          </button>
        )}
      </div>
    </main>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-4">
      <span className="text-[17px]">{label}</span>
      <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={
              v === value
                ? "rounded-md bg-background px-3 py-1 text-[13px] font-medium shadow-sm"
                : "rounded-md px-3 py-1 text-[13px] text-muted-foreground"
            }
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
