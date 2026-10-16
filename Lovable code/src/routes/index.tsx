import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/lift/auth-screen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lift — Remember what you lifted last time" },
      {
        name: "description",
        content:
          "A calm workout log: open today's workout, see your last sessions, and know exactly what to lift.",
      },
      { property: "og:title", content: "Lift — Remember what you lifted last time" },
      {
        property: "og:description",
        content:
          "A calm workout log: open today's workout, see your last sessions, and know exactly what to lift.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthScreen,
});

