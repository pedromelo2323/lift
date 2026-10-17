import { createClient } from "@/lib/supabase/client";

export const profileKey = ["profile"] as const;

export type Profile = { id: string; displayName: string | null };

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getSession();
  const user = auth.session?.user;
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const fallback =
    (user.user_metadata?.["full_name"] as string | undefined) ??
    (user.user_metadata?.["name"] as string | undefined) ??
    user.email?.split("@")[0] ??
    null;

  return { id: user.id, displayName: data?.display_name || fallback };
}

export function firstName(displayName: string | null | undefined) {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : null;
}
