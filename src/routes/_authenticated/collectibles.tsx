import { createFileRoute } from "@tanstack/react-router";
import { TradeHubScreen } from "./markets";

export const Route = createFileRoute("/_authenticated/collectibles")({
  head: () => ({
    meta: [
      { title: "Assets & Collectibles — Capitalfortune" },
      { name: "description", content: "Luxury assets, collections and valuations." },
      { property: "og:title", content: "Assets & Collectibles — Capitalfortune" },
      { property: "og:description", content: "Luxury assets, collections and valuations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <TradeHubScreen initialTab="assets" />,
});
