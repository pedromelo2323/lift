import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

export { isSupabaseConfigured } from "@/lib/supabase/env";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserClient | null = null;
let accessToken: string | null = null;

export function createClient(): BrowserClient {
  if (browserClient) return browserClient;
  const { url, key } = getSupabaseEnv();
  const client = createBrowserClient<Database>(url, key);
  if (typeof window === "undefined") return client;
  client.auth.onAuthStateChange((_event, session) => {
    accessToken = session?.access_token ?? null;
  });
  browserClient = client;
  return client;
}

// pagehide handlers can't await getSession() before iOS suspends the page.
export function getCachedAccessToken() {
  return accessToken;
}
