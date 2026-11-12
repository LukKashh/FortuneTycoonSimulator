import { createFileRoute } from "@tanstack/react-router";
import { UnifiedEntryScreen } from "./auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Capitalfortune — Build Wealth From $0" },
      {
        name: "description",
        content:
          "Start with nothing. Tap, acquire companies, trade stocks and crypto, collect rent and luxury assets, and build a corporation with friends.",
      },
      { property: "og:title", content: "Capitalfortune — Build Wealth From $0" },
      {
        property: "og:description",
        content:
          "A mobile-first wealth and business tycoon game with cloud saves and cooperative corporations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <UnifiedEntryScreen />,
});
