import { useEffect, useState } from "react";
import { CASINO, type ChickenDifficulty } from "@/game/config";
import { casinoWalletDollars, chickenMultiplier, type CasinoState } from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { ChickenSpriteSvg, HazardCarSvg } from "../casinoTextures";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

export function ChickenGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [difficulty, setDifficulty] = useState<ChickenDifficulty>("easy");
  const [carTick, setCarTick] = useState(0);

  const st = cs.active?.game === "chicken" ? cs.active : null;
  const last =
    !st && cs.last?.game === "chicken"
      ? (cs.last.detail as {
          difficulty: ChickenDifficulty;
          step: number;
          hitLane?: number;
          mult: number;
          won: boolean;
        })
      : null;

  useEffect(() => {
    const id = setInterval(() => setCarTick((t) => (t + 1) % 100), 180);
    return () => clearInterval(id);
  }, []);

  const activeDiff = st?.difficulty ?? last?.difficulty ?? difficulty;
  const curStep = st ? st.step : last ? last.step : 0;
  const hitLane = last?.hitLane ?? null;
  const curMult = st ? st.mult : last?.won ? last.mult : 1;
  const nextMult = chickenMultiplier(activeDiff, curStep + 1);
  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);
  const totalLanes = CASINO.chickenMaxSteps;

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

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-300">Road Difficulty</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(CASINO.chickenModes) as ChickenDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                disabled={!!st}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "rounded-md py-1.5 text-xs font-semibold transition-colors",
                  activeDiff === d
                    ? "bg-amber-400 text-slate-950"
                    : "bg-[#0f212e] text-slate-300 hover:bg-slate-800",
                )}
              >
                {CASINO.chickenModes[d].label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400">
            {CASINO.chickenModes[activeDiff].desc} · 3.00% House Edge
          </div>
        </div>

        {st ? (
          <div className="space-y-2">
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                soundFx.hop();
                void run({ type: "casinoChicken", move: "step" });
              }}
              className="h-11 w-full bg-amber-400 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              Hop to Lane {st.step + 1} ({nextMult.toFixed(2)}×)
            </Button>
            <Button
              type="button"
              disabled={pending || st.step < 1}
              onClick={() => {
                soundFx.win(st.mult >= 4);
                void run({ type: "casinoChicken", move: "cashout" });
              }}
              className="h-10 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
            >
              Cash Out {money(st.bet * CASINO.chipValue * st.mult)} ({st.mult.toFixed(2)}×)
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            disabled={!canStart}
            onClick={() => {
              soundFx.chip();
              void run({ type: "casinoChicken", move: "start", bet: betChips, difficulty });
            }}
            className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
          >
            Start Crossing ({chickenMultiplier(difficulty, 1).toFixed(2)}× Step 1)
          </Button>
        )}

        <GameOutcomeBanner cs={cs} gameKey="chicken" />
      </div>

      {/* Highway Crossing Stage */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-700/80 bg-[#0f212e] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Lane {curStep} / {totalLanes}
          </span>
          <span className="num font-bold text-amber-300">Multiplier: {curMult.toFixed(2)}×</span>
        </div>

        {/* Multi-lane Road Track */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {/* Curb / Start */}
          <div className="flex flex-col items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-2 min-h-[112px]">
            <span className="text-[10px] font-bold text-emerald-300">START</span>
            {curStep === 0 && !hitLane ? (
              <ChickenSpriteSvg state="idle" size={38} />
            ) : (
              <div className="h-9" />
            )}
            <span className="num text-[10px] text-slate-400">1.00×</span>
          </div>

          {Array.from({ length: totalLanes }, (_, idx) => {
            const lane = idx + 1;
            const laneMult = chickenMultiplier(activeDiff, lane);
            const passed = lane <= curStep;
            const isCurrent = lane === curStep && !hitLane;
            const isHit = hitLane === lane;
            const carY = (carTick * (2 + (lane % 3)) + lane * 17) % 100;
            const showMovingCar = st && lane > curStep && !isHit;

            return (
              <div
                key={lane}
                className={cn(
                  "relative flex min-h-[112px] flex-col items-center justify-between overflow-hidden rounded-lg border p-2 transition-colors",
                  isHit
                    ? "border-rose-500 bg-rose-950/60"
                    : passed
                      ? "border-emerald-500/60 bg-emerald-950/35"
                      : "border-slate-700 bg-[#182633]",
                )}
              >
                {/* Dashed road divider */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-px border-r border-dashed border-slate-600/60"
                />
                <span className="num z-10 text-[10px] font-bold text-slate-400">L{lane}</span>

                {isHit ? (
                  <div className="z-10 flex flex-col items-center">
                    <HazardCarSvg variant={lane} />
                    <ChickenSpriteSvg state="hit" size={30} />
                  </div>
                ) : isCurrent ? (
                  <div className="z-10">
                    <ChickenSpriteSvg state={last?.won ? "win" : "hop"} size={38} />
                  </div>
                ) : showMovingCar ? (
                  <div
                    className="pointer-events-none opacity-75 transition-transform duration-150"
                    style={{ transform: `translateY(${(carY - 50) * 0.35}px)` }}
                  >
                    <HazardCarSvg variant={lane} />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold",
                      passed
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                        : "border-slate-600 bg-slate-800/80 text-slate-400",
                    )}
                  >
                    {passed ? "✓" : "•"}
                  </div>
                )}

                <span
                  className={cn(
                    "num z-10 text-[11px] font-bold",
                    passed ? "text-emerald-300" : isHit ? "text-rose-300" : "text-amber-300",
                  )}
                >
                  {laneMult.toFixed(2)}×
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
