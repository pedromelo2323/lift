"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordRules, friendlyAuthError, passwordOk } from "@/components/auth/PasswordRules";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-3 text-[15px] outline-none transition-colors focus:border-foreground";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {open ? null : <path d="M3 3l18 18" />}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link") {
      setMessage("That link expired or was already used. Try again.");
    }
  }, []);

  function enterApp() {
    router.replace("/");
    router.refresh();
  }

  async function continueWithGoogle() {
    setMessage(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMessage(friendlyAuthError(error.message));
  }

  async function forgotPassword() {
    if (!email) {
      setMessage("Enter your email above, then tap Forgot password.");
      return;
    }
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setMessage(error ? friendlyAuthError(error.message) : "Check your email for a reset link.");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        if (!passwordOk(password)) throw new Error("Your password doesn't meet all the rules yet.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) enterApp();
        else setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        enterApp();
      }
    } catch (error) {
      setMessage(error instanceof Error ? friendlyAuthError(error.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16">
      <div className="auth-in flex flex-col items-center text-center">
        <h1 className="text-[44px] font-semibold leading-none tracking-[-0.04em]">Lift</h1>
        <p className="mt-3 text-[11px] font-light uppercase tracking-[0.18em] text-muted-foreground">
          Just heavy
        </p>
      </div>

      <div className="auth-in mt-10" style={{ animationDelay: "150ms" }}>
        <button
          type="button"
          onClick={continueWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border py-3 text-[15px] transition-colors active:bg-secondary"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
            >
              <EyeIcon open={!showPassword} />
            </button>
          </div>
          {mode === "signup" ? <PasswordRules password={password} /> : null}
          {mode === "signin" ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={forgotPassword}
                className="text-[12px] text-muted-foreground underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy || (mode === "signup" && !passwordOk(password))}
            className="w-full rounded-xl bg-foreground py-3 text-[15px] font-medium text-background transition-opacity disabled:opacity-40"
          >
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setMessage(null);
        }}
        className="mt-6 self-center text-[13px] text-muted-foreground"
      >
        {mode === "signin" ? "No account yet? " : "Already have an account? "}
        <span className="underline underline-offset-4">{mode === "signin" ? "Create one" : "Sign in"}</span>
      </button>

      <p className="mt-10 text-center text-[11px] font-light text-muted-foreground">
        Private by default. Your log is yours.
      </p>
      <p className="mt-2 text-center text-[11px] font-light text-muted-foreground">
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> ·{" "}
        <Link href="/support">Support</Link>
      </p>
    </div>
  );
}
