import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/hooks/use-game";
import type { CasinoState } from "@/game/casino";
import { Loading } from "@/components/game/ui";
import { CasinoHub } from "@/components/casino/CasinoLobby";

export const Route = createFileRoute("/_authenticated/casino")({
  head: () => ({
    meta: [
      { title: "Casino — Capitalfortune" },
      {
        name: "description",
        content:
          "Stake-style online casino with $100, $1,000, and $5,000 chips, 7 animated originals, and 6 custom slot games.",
      },
      { property: "og:title", content: "Casino — Capitalfortune" },
      {
        property: "og:description",
        content:
          "Play Dice, Plinko, Keno, Crash, Mines, Chicken, Hi-Lo, and 6 Slots with a unified Digital Chip Wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CasinoPage,
});

const EMPTY_CASINO: CasinoState = {
  chips: 0,
  denoms: { 100: 0, 1000: 0, 5000: 0 },
  round: 0,
  active: null,
  last: null,
  stats: { wagered: 0, won: 0, rounds: 0, biggestWin: 0 },
};

function CasinoPage() {
  const { data } = useGame();
  if (!data) return <Loading />;
  const cs = data.state.casino ?? EMPTY_CASINO;
  return <CasinoHub cash={data.state.cash} cs={cs} />;
}
