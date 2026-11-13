import { useEffect, useRef, useState } from "react";
import { CASINO, type KenoRisk } from "@/game/config";
import { casinoWalletDollars, type CasinoState } from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

export function KenoGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [risk, setRisk] = useState<KenoRisk>("classic");
  const [picks, setPicks] = useState<number[]>([3, 7, 14, 21, 28, 35]);
  const [revealedCount, setRevealedCount] = useState(10);
  const [animating, setAnimating] = useState(false);
  const seenRoundRef = useRef<number>(cs.round);

  const last =
    cs.last?.game === "keno"
      ? (cs.last.detail as {
          draw: number[];
          picks: number[];
          hits: number;
          mult: number;
          risk: KenoRisk;
        })
      : null;

  useEffect(() => {
    if (cs.round !== seenRoundRef.current && cs.last?.game === "keno") {
      seenRoundRef.current = cs.round;
      setRevealedCount(0);
      setAnimating(true);
      let idx = 0;
      const timer = setInterval(() => {
        idx += 1;
        soundFx.orbPop(idx);
        setRevealedCount(idx);
        if (idx >= 10) {
          clearInterval(timer);
          setAnimating(false);
          if ((cs.last?.payout ?? 0) > (cs.last?.bet ?? 0)) soundFx.win();
        }
      }, 75);
      return () => clearInterval(timer);
    }
  }, [cs.round, cs.last]);

  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);
  const drawnVisible = last ? last.draw.slice(0, revealedCount) : [];
  const table = CASINO.keno40Pay[risk][picks.length] ?? [];

  const toggle = (n: number) => {
    if (animating) return;
    soundFx.click();
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < 10 ? [...p, n] : p));
  };

  function quickPick() {
    if (animating) return;
    soundFx.click();
    const pool = Array.from({ length: 40 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setPicks(pool.slice(0, 6));
  }

  const canPlay =
    !pending &&
    !animating &&
    picks.length >= 1 &&
    betChips >= CASINO.minBet &&
    (Number(betUsd) || 0) <= walletUsd + 0.001;

  return (
    <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
      <div className="space-y-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-4">
        <BetAmountControl
          betUsd={betUsd}
          setBetUsd={setBetUsd}
          cs={cs}
          disabled={pending || animating}
        />

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-300">Risk Mode</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["low", "classic", "high"] as KenoRisk[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={animating}
                onClick={() => setRisk(r)}
                className={cn(
                  "rounded-md py-1.5 text-xs font-semibold capitalize transition-colors",
                  risk === r
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-[#0f212e] text-slate-300 hover:bg-slate-800",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={animating}
            onClick={quickPick}
            className="border-slate-700 bg-[#0f212e] text-xs text-slate-200 hover:bg-slate-800"
          >
            Auto Pick
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={animating || picks.length === 0}
            onClick={() => setPicks([])}
            className="border-slate-700 bg-[#0f212e] text-xs text-slate-200 hover:bg-slate-800"
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-[#0f212e] px-3 py-2 text-xs text-slate-400">
          <span>House Edge</span>
          <span className="num font-semibold text-slate-200">3.00% (97.0% RTP)</span>
        </div>

        <Button
          type="button"
          disabled={!canPlay}
          onClick={() => void run({ type: "casinoKeno", bet: betChips, picks, risk })}
          className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          {animating ? "Drawing Balls..." : `Draw 10 Balls (${picks.length}/10)`}
        </Button>

        <GameOutcomeBanner cs={cs} gameKey="keno" />
      </div>

      {/* 40-Orb Keno Board */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-700/80 bg-[#0f212e] p-4">
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
            const sel = picks.includes(n);
            const drawn = drawnVisible.includes(n);
            const hit = sel && drawn;
            return (
              <button
                key={n}
                type="button"
                disabled={animating}
                onClick={() => toggle(n)}
                className={cn(
                  "num flex aspect-square items-center justify-center rounded-lg border text-sm font-bold transition-all duration-150",
                  hit
                    ? "scale-105 border-emerald-300 bg-emerald-500 text-slate-950 shadow-md"
                    : sel && !drawn
                      ? "border-sky-400 bg-sky-500/25 text-sky-200"
                      : drawn
                        ? "border-amber-400/70 bg-amber-500/15 text-amber-300"
                        : "border-slate-700/80 bg-[#1a2c38] text-slate-200 hover:border-slate-500",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* Payout Multiplier Ladder */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400">
            Payout Multipliers ({picks.length} Selected)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {picks.length === 0 ? (
              <span className="text-xs text-slate-500">
                Pick 1 to 10 numbers above to see payouts
              </span>
            ) : (
              table.map((mult, hits) => {
                const isHitTier =
                  !animating &&
                  last &&
                  last.hits === hits &&
                  last.picks.length === picks.length &&
                  last.risk === risk;
                return (
                  <div
                    key={hits}
                    className={cn(
                      "flex flex-col items-center rounded-md border px-2.5 py-1 text-center",
                      isHitTier
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-700/70 bg-[#1a2c38] text-slate-300",
                    )}
                  >
                    <span className="num text-[11px] font-bold">{mult}×</span>
                    <span className="text-[10px] text-slate-400">{hits} hit</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
