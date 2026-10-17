"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordRules, friendlyAuthError, passwordOk } from "@/components/auth/PasswordRules";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(friendlyAuthError(error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16">
      <h1 className="text-center text-[28px] font-semibold tracking-tight">New password</h1>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-[15px] outline-none transition-colors focus:border-foreground"
        />
        <PasswordRules password={password} />
        <button
          type="submit"
          disabled={busy || !passwordOk(password)}
          className="w-full rounded-xl bg-foreground py-3 text-[15px] font-medium text-background disabled:opacity-40"
        >
          {busy ? "One moment…" : "Save password"}
        </button>
      </form>
      {message ? <p className="mt-4 text-[13px] text-muted-foreground">{message}</p> : null}
    </div>
  );
}
