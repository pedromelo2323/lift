const PASSWORD_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Upper & lowercase", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const COMMON = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "111111",
  "letmein",
  "iloveyou",
  "admin",
  "welcome",
  "monkey",
  "dragon",
  "football",
];

function isCommon(password: string) {
  const s = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  return COMMON.some((c) => s === c || s.replace(/\d+$/, "") === c);
}

export function passwordOk(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password)) && !isCommon(password);
}

export function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked") || m.includes("known")) {
    return "This password shows up in public lists of hacked passwords. Try a more unique one.";
  }
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("already registered")) return "There's already an account with this email. Sign in instead.";
  if (m.includes("email not confirmed")) return "Confirm your email first — check your inbox.";
  return message;
}

export function PasswordRules({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const next = PASSWORD_RULES.find((rule) => !rule.test(password));
  return (
    <div className="space-y-1.5 px-1">
      <div className="h-px w-full overflow-hidden bg-border">
        <div
          className="h-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${(passed / PASSWORD_RULES.length) * 100}%` }}
        />
      </div>
      <p className="text-[11px] font-light text-muted-foreground">
        {next
          ? `Needs ${next.label.toLowerCase()}`
          : isCommon(password)
            ? "Too common"
            : "Strong password"}
      </p>
    </div>
  );
}
