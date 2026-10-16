import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PasswordRules, passwordOk, friendlyPasswordError } from "@/components/lift/password-rules";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Lift" },
      { name: "description", content: "Choose a new password for your Lift account." },
      { property: "og:title", content: "Reset password — Lift" },
      { property: "og:description", content: "Choose a new password for your Lift account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(friendlyPasswordError(error.message));
    navigate({ to: "/home" });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-center text-[28px] font-semibold tracking-tight">New password</h1>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border border-input bg-background px-3 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
        />
        <PasswordRules password={password} />
        <button
          type="submit"
          disabled={busy || !passwordOk(password)}
          className="w-full rounded-xl bg-primary py-3 text-[15px] font-medium text-primary-foreground disabled:opacity-40"
        >
          {busy ? "One moment…" : "Save password"}
        </button>
      </form>
      {message ? <p className="mt-4 text-[13px] text-muted-foreground">{message}</p> : null}
    </main>
  );
}
