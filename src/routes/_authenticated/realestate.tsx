import { createFileRoute } from "@tanstack/react-router";
import { EmpireScreen } from "./empire";

export const Route = createFileRoute("/_authenticated/realestate")({
  head: () => ({
    meta: [
      { title: "Real Estate — Capitalfortune" },
      { name: "description", content: "Rental property investments." },
      { property: "og:title", content: "Real Estate — Capitalfortune" },
      { property: "og:description", content: "Rental property investments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <EmpireScreen initialSection="realestate" />,
});
