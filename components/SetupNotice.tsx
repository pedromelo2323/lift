import { isSupabaseConfigured } from "@/lib/supabase/server";

export function SetupNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="mb-6 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3">
      <p className="text-[15px] font-medium text-[#1D1D1F]">Connect Supabase</p>
      <p className="mt-1 text-[14px] leading-relaxed text-[#86868B]">
        Copy <code className="text-[13px]">.env.example</code> to{" "}
        <code className="text-[13px]">.env.local</code>, run the migration in{" "}
        <code className="text-[13px]">supabase/migrations</code>, then restart the app.
      </p>
    </div>
  );
}
