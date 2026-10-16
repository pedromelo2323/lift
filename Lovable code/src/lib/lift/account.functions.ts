import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Permanently deletes the signed-in user's data and account (App Store requirement).
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    for (const table of [
      "exercise_sets",
      "session_notes",
      "sessions",
      "exercises",
      "workouts",
      "bug_reports",
    ] as const) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    await supabase.from("profiles").delete().eq("id", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
