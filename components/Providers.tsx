"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function AuthSync() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const userId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (userId.current !== undefined && userId.current !== next) queryClient.clear();
      userId.current = next;
      if (event === "SIGNED_OUT") router.replace("/auth");
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 30 * 60_000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
    </QueryClientProvider>
  );
}
