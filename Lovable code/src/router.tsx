import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data around so the app opens with no signal.
        gcTime: 1000 * 60 * 60 * 24 * 14,
        staleTime: 1000 * 30,
        retry: 2,
      },
      mutations: {
        // Writes made offline stay queued and fire once the connection is back.
        retry: 3,
      },
    },
  });

  if (typeof window !== "undefined") {
    persistQueryClient({
      queryClient,
      persister: createSyncStoragePersister({ storage: window.localStorage }),
      maxAge: 1000 * 60 * 60 * 24 * 14,
      buster: "lift-v1",
    });
    window.addEventListener("online", () => {
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    });
  }

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
