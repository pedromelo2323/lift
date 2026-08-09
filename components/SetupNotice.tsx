import { isSupabaseConfigured } from "@/lib/supabase/server";

export function SetupNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-[15px] font-medium">Connect Supabase</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        Copy <code className="text-[13px]">.env.example</code> to{" "}
        <code className="text-[13px]">.env.local</code>, run the migration in{" "}
        <code className="text-[13px]">supabase/migrations</code>, then restart the app.
      </p>
    </div>
  );
}
