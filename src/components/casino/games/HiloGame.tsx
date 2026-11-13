import { useState } from "react";
import { ArrowDown, ArrowUp, SkipForward } from "lucide-react";
import { CASINO } from "@/game/config";
import {
  casinoWalletDollars,
  hiloOdds,
  hiloStepMult,
  type Card as PCard,
  type CasinoState,
} from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { PlayingCardVisual } from "../casinoTextures";
import { soundFx } from "../soundFx";

export function HiloGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");

  const st = cs.active?.game === "hilo" ? cs.active : null;
  const last = !st && cs.last?.game === "hilo" ? (cs.last.detail as { history: PCard[] }) : null;
  const history = st?.history ?? last?.history ?? [];
  const currentCard = st?.card ?? history[history.length - 1];
  const odds = st ? hiloOdds(st.card.r) : null;
  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);

  const canStart =
    !pending && !st && betChips >= CASINO.minBet && (Number(betUsd) || 0) <= walletUsd + 0.001;

  return (
    <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
      <div className="space-y-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-4">
        <BetAmountControl
          betUsd={betUsd}
          setBetUsd={setBetUsd}
          cs={cs}
          disabled={pending || !!st}
        />

        <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-[#0f212e] px-3 py-2 text-xs text-slate-400">
          <span>House Edge</span>
          <span className="num font-semibold text-slate-200">3.00% (97.0% RTP)</span>
        </div>

        {st && odds ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                disabled={pending || odds.higher <= 0}
                onClick={() => {
                  soundFx.cardFlip();
                  void run({ type: "casinoHilo", move: "higher" });
                }}
                className="h-12 flex-col gap-0.5 bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3.5 w-3.5" />
                  {st.card.r === 1 ? "Higher" : "Higher / Same"}
                </span>
                <span className="num text-[11px] opacity-85">
                  {(odds.higher * 100).toFixed(1)}% · {hiloStepMult(odds.higher).toFixed(2)}×
                </span>
              </Button>
              <Button
                type="button"
                disabled={pending || odds.lower <= 0}
                onClick={() => {
                  soundFx.cardFlip();
                  void run({ type: "casinoHilo", move: "lower" });
                }}
                className="h-12 flex-col gap-0.5 bg-sky-500 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-3.5 w-3.5" />
                  {st.card.r === 13 ? "Lower" : "Lower / Same"}
                </span>
                <span className="num text-[11px] opacity-85">
                  {(odds.lower * 100).toFixed(1)}% · {hiloStepMult(odds.lower).toFixed(2)}×
                </span>
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={pending || (st.skips ?? 0) >= CASINO.hiloMaxSkips}
              onClick={() => {
                soundFx.cardFlip();
                void run({ type: "casinoHilo", move: "skip" });
              }}
              className="h-9 w-full border-slate-700 bg-[#0f212e] text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <SkipForward className="mr-1.5 h-3.5 w-3.5" />
              Skip Card ({CASINO.hiloMaxSkips - (st.skips ?? 0)} left)
            </Button>
            <Button
              type="button"
              disabled={pending || st.mult <= 1}
              onClick={() => {
                soundFx.win();
                void run({ type: "casinoHilo", move: "cashout" });
              }}
              className="h-11 w-full bg-amber-400 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              Cash Out {money(st.bet * CASINO.chipValue * st.mult)} ({st.mult.toFixed(2)}×)
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            disabled={!canStart}
            onClick={() => {
              soundFx.cardFlip();
              void run({ type: "casinoHilo", move: "start", bet: betChips });
            }}
            className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
          >
            Deal Opening Card
          </Button>
        )}

        <GameOutcomeBanner cs={cs} gameKey="hilo" />
      </div>

      {/* Animated Card Table */}
      <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-700/80 bg-[#0f212e] p-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Active Deck</span>
          <span className="num font-bold text-amber-300">
            Chain Multiplier: {st ? st.mult.toFixed(2) : "1.00"}×
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 py-4">
          <PlayingCardVisual hidden size="lg" />
          <PlayingCardVisual
            key={`${currentCard?.r ?? 0}-${currentCard?.s ?? 0}-${history.length}`}
            c={currentCard}
            hidden={!currentCard}
            size="lg"
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400">Card Chain History</div>
          <div className="flex min-h-16 items-center gap-2 overflow-x-auto pb-1">
            {history.length === 0 ? (
              <span className="text-xs text-slate-500">Deal a card to begin your Hi-Lo streak</span>
            ) : (
              history.map((c, idx) => <PlayingCardVisual key={idx} c={c} size="sm" />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
