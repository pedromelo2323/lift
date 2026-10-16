import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/lift/auth-screen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lift" },
      { name: "description", content: "Sign in to Lift to keep your training log private." },
      { property: "og:title", content: "Sign in — Lift" },
      { property: "og:description", content: "Sign in to Lift to keep your training log private." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthScreen,
});
