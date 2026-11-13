import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { CASINO } from "@/game/config";
import {
  casinoWalletDollars,
  diceMultiplier,
  diceWinChance,
  type CasinoState,
} from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

export function DiceGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState<"over" | "under">("over");
  const [displayRoll, setDisplayRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{ roll: number; won: boolean }[]>([]);
  const seenRoundRef = useRef<number>(cs.round);

  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);
  const winChance = diceWinChance(target, condition);
  const mult = diceMultiplier(winChance);
  const profitUsd = (Number(betUsd) || 0) * (mult - 1);

  useEffect(() => {
    if (cs.round !== seenRoundRef.current && cs.last?.game === "dice") {
      seenRoundRef.current = cs.round;
      const finalRoll = Number(cs.last.detail.roll);
      const won = Boolean(cs.last.detail.won);
      setRolling(true);
      const start = performance.now();
      const duration = 360;
      let raf = 0;
      const startVal = displayRoll ?? 50;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const cur = startVal + (finalRoll - startVal) * eased;
        setDisplayRoll(Math.round(cur * 100) / 100);
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          setDisplayRoll(finalRoll);
          setRolling(false);
          if (won) soundFx.win();
          else soundFx.bust();
          setHistory((prev) => [{ roll: finalRoll, won }, ...prev].slice(0, 10));
        }
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }
  }, [cs.round, cs.last, displayRoll]);

  const canBet =
    !pending && !rolling && betChips >= CASINO.minBet && (Number(betUsd) || 0) <= walletUsd + 0.001;

  async function handleRoll() {
    if (!canBet) return;
    soundFx.roll();
    await run({ type: "casinoDice", bet: betChips, target, condition });
  }

  const lastWon = cs.last?.game === "dice" ? Boolean(cs.last.detail.won) : null;

  return (
    <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
      {/* Control Dock */}
      <div className="space-y-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-4">
        <BetAmountControl
          betUsd={betUsd}
          setBetUsd={setBetUsd}
          cs={cs}
          disabled={pending || rolling}
        />

        <div className="rounded-lg border border-slate-700/70 bg-[#0f212e] p-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Profit on Win</span>
            <span className="num font-bold text-emerald-400">+{money(profitUsd)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-slate-400">
            <span>House Edge</span>
            <span className="num font-semibold text-slate-200">1.00% (99% RTP)</span>
          </div>
        </div>

        <Button
          type="button"
          disabled={!canBet}
          onClick={() => void handleRoll()}
          className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          {rolling ? "Rolling..." : `Roll Dice (${mult.toFixed(2)}×)`}
        </Button>

        <GameOutcomeBanner cs={cs} gameKey="dice" />
      </div>

      {/* Live Animated Dice Stage */}
      <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-700/80 bg-[#0f212e] p-5">
        {/* Recent Rolls Strip */}
        <div className="flex min-h-7 items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400">Recent Rolls</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {history.length === 0 ? (
              <span className="text-xs text-slate-500">No rolls this session</span>
            ) : (
              history.map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    "num rounded-md px-2 py-0.5 text-xs font-bold",
                    h.won ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400",
                  )}
                >
                  {h.roll.toFixed(2)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Central Animated Roll Readout + Die Cube */}
        <div className="flex flex-col items-center justify-center py-4">
          <div
            className={cn(
              "relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 bg-[#1a2c38] shadow-xl transition-transform duration-200",
              rolling && "scale-105 rotate-6",
              lastWon === true && !rolling && "border-emerald-400",
              lastWon === false && !rolling && "border-rose-500/80",
              lastWon === null && "border-slate-600",
            )}
          >
            <span
              className={cn(
                "num text-2xl font-extrabold",
                lastWon === true
                  ? "text-emerald-400"
                  : lastWon === false
                    ? "text-rose-400"
                    : "text-white",
              )}
            >
              {displayRoll !== null ? displayRoll.toFixed(2) : "50.00"}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {condition === "over"
              ? `Target: Roll ≥ ${target.toFixed(2)}`
              : `Target: Roll < ${target.toFixed(2)}`}
          </div>
        </div>

        {/* Visual Slider Bar with Win/Loss Split & Animated Marker */}
        <div className="space-y-3">
          <div className="relative pt-7">
            {/* Floating Roll Marker */}
            {displayRoll !== null && (
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 transition-all duration-75"
                style={{ left: `${Math.max(2, Math.min(98, displayRoll))}%` }}
              >
                <div
                  className={cn(
                    "num rounded-md border px-2 py-0.5 text-xs font-bold shadow",
                    lastWon
                      ? "border-emerald-400 bg-emerald-500 text-slate-950"
                      : "border-rose-400 bg-rose-500 text-white",
                  )}
                >
                  {displayRoll.toFixed(2)}
                </div>
              </div>
            )}

            {/* Colored Track */}
            <div className="relative flex h-4 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900">
              {condition === "under" ? (
                <>
                  <div className="h-full bg-emerald-500/85" style={{ width: `${target}%` }} />
                  <div className="h-full flex-1 bg-rose-500/75" />
                </>
              ) : (
                <>
                  <div className="h-full bg-rose-500/75" style={{ width: `${target}%` }} />
                  <div className="h-full flex-1 bg-emerald-500/85" />
                </>
              )}
            </div>

            <input
              type="range"
              min={2}
              max={98}
              step={1}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              aria-label="Roll target"
              className="mt-2 w-full cursor-pointer accent-emerald-400"
            />
            <div className="num flex justify-between text-[11px] text-slate-400">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* 3-Stat Interactive Bar */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-3">
            <div>
              <div className="text-[11px] text-slate-400">Multiplier</div>
              <div className="num mt-0.5 text-sm font-bold text-white">{mult.toFixed(4)}×</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Roll Mode</div>
              <button
                type="button"
                onClick={() => {
                  soundFx.click();
                  setCondition((c) => (c === "over" ? "under" : "over"));
                }}
                className="mt-0.5 inline-flex items-center gap-1 rounded bg-[#0f212e] px-2 py-0.5 text-xs font-bold text-sky-300 hover:bg-slate-800"
              >
                <ArrowLeftRight className="h-3 w-3" />
                {condition === "over" ? `Over ${target}` : `Under ${target}`}
              </button>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Win Chance</div>
              <div className="num mt-0.5 text-sm font-bold text-emerald-400">
                {winChance.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
