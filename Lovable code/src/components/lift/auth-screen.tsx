import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PasswordRules, passwordOk, friendlyPasswordError } from "./password-rules";
export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/home" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const forgot = async () => {
    if (!email) return setMessage("Enter your email above, then tap Forgot password.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.hostname.includes("id-preview")
        ? "https://magical-app-lab.lovable.app/reset-password"
        : `${window.location.origin}/reset-password`,
    });
    setMessage(error ? error.message : "Check your email for a reset link.");
  };

  const withProvider = async (provider: "google" | "apple") => {
    setMessage(null);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if ("error" in result && result.error) setMessage(result.error.message);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        if (!passwordOk(password)) throw new Error("Your password doesn't meet all the rules yet.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.hostname.includes("id-preview")
              ? "https://magical-app-lab.lovable.app/home"
              : `${window.location.origin}/home`,
          },
        });
        if (error) throw error;
        if (!data.session) setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? friendlyPasswordError(error.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h1 className="text-[44px] font-semibold leading-none tracking-[-0.04em]">
          Lift
        </h1>
        <p className="mt-3 text-[11px] font-light uppercase tracking-[0.18em] text-muted-foreground/80">
          Just heavy
        </p>
      </div>

      <div className="mt-10 space-y-3 animate-in fade-in duration-700 delay-150 fill-mode-both">
        <button
          type="button"
          onClick={() => withProvider("apple")}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-[15px] font-medium text-primary-foreground"
        >
          <span className="flex w-[190px] items-center gap-3"><span className="flex size-5 items-center justify-center"><svg aria-hidden viewBox="0 0 24 24" className="size-5 -translate-y-px" fill="currentColor">
            <path d="M16.37 12.64c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.68ZM14.1 5.88c.63-.77 1.06-1.83.94-2.88-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.29Z" />
          </svg></span>
          Continue with Apple</span>
        </button>
        <button
          type="button"
          onClick={() => withProvider("google")}
          className="flex w-full items-center justify-center rounded-xl border border-input py-3 text-[15px] transition-colors active:bg-secondary"
        >
          <span className="flex w-[190px] items-center gap-3"><span className="flex size-5 items-center justify-center"><svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
          </svg></span>
          Continue with Google</span>
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-[12px] text-muted-foreground/60">
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
          className="w-full rounded-xl border border-input bg-background px-3 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-input bg-background py-3 pl-3 pr-11 text-[15px] outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        </div>
        {mode === "signup" ? <PasswordRules password={password} /> : null}
        {mode === "signin" ? (
          <div className="flex justify-end">
            <button type="button" onClick={forgot} className="text-[12px] text-muted-foreground underline underline-offset-4">
              Forgot password?
            </button>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={busy || (mode === "signup" && !passwordOk(password))}
          className="w-full rounded-xl border border-foreground py-3 text-[15px] font-medium disabled:opacity-40"
        >
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{message}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
        className="mt-6 self-center text-[13px] text-muted-foreground"
      >
        {mode === "signin" ? "No account yet? " : "Already have an account? "}<span className="underline underline-offset-4">{mode === "signin" ? "Create one" : "Sign in"}</span>
      </button>

      <p className="mt-10 text-center text-[11px] font-light text-muted-foreground/70">
        Private by default. Your log is yours.
      </p>
      <p className="mt-2 text-center text-[11px] font-light text-muted-foreground/70">
        <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/support">Support</a>
      </p>
    </main>
  );
}
