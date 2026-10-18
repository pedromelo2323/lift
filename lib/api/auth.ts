import { createClient } from "@/lib/supabase/server";

/** The signed-in user's Supabase client and id, or null. Row level security applies to every query. */
export async function getSignedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}
