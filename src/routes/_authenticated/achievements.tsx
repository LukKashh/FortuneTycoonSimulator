import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/hooks/use-game";
import { GameScrollContainer, Loading, PageHeader } from "@/components/game/ui";
import { AchievementsView } from "@/components/game/AchievementsView";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Capitalfortune" },
      { name: "description", content: "Track your milestone achievement levels and rewards." },
      { property: "og:title", content: "Achievements — Capitalfortune" },
      {
        property: "og:description",
        content: "Track your milestone achievement levels and rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data } = useGame();
  if (!data) return <Loading />;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="Achievements" subtitle="Track milestone progression by type" />
      <GameScrollContainer>
        <AchievementsView />
      </GameScrollContainer>
    </div>
  );
}
