export const PASSWORD_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Upper & lowercase", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const COMMON = ["password", "123456", "12345678", "qwerty", "abc123", "111111", "letmein", "iloveyou", "admin", "welcome", "monkey", "dragon", "football"];
export const isCommon = (p: string) => {
  const s = p.toLowerCase().replace(/[^a-z0-9]/g, "");
  return COMMON.some((c) => s === c || s.replace(/\d+$/, "") === c);
};

export const passwordOk = (p: string) => PASSWORD_RULES.every((r) => r.test(p)) && !isCommon(p);

export function friendlyPasswordError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked") || m.includes("known"))
    return "This password is too common — it shows up in public lists of hacked passwords from other sites. Try a more unique one.";
  return msg;
}

export function PasswordRules({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const next = PASSWORD_RULES.find((r) => !r.test(password));
  return (
    <div className="space-y-1.5 px-1">
      <div className="h-px w-full overflow-hidden bg-border">
        <div
          className="h-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${(passed / PASSWORD_RULES.length) * 100}%` }}
        />
      </div>
      <p className="text-[11px] font-light text-muted-foreground/70">
        {next ? `Needs ${next.label.toLowerCase()}` : isCommon(password) ? "Too common" : "Strong password"}
      </p>
    </div>
  );
}
