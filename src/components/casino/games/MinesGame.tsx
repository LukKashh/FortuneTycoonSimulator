import { useState } from "react";
import { Bomb, Gem, Shuffle } from "lucide-react";
import { CASINO } from "@/game/config";
import { casinoWalletDollars, minesMultiplier, type CasinoState } from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

export function MinesGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [mines, setMines] = useState(3);

  const st = cs.active?.game === "mines" ? cs.active : null;
  const last =
    !st && cs.last?.game === "mines"
      ? (cs.last.detail as { mines: number[]; revealed: number[]; boom: boolean; hit?: number })
      : null;

  const revealed = st?.revealed ?? last?.revealed ?? [];
  const activeMines = st?.mines ?? mines;
  const curMult = minesMultiplier(activeMines, revealed.length);
  const nextMult = minesMultiplier(activeMines, revealed.length + 1);
  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);

  async function revealTile(tile: number) {
    if (!st || pending || revealed.includes(tile)) return;
    soundFx.click();
    await run({ type: "casinoMines", move: "reveal", tile });
  }

  function pickRandom() {
    if (!st || pending) return;
    const avail = Array.from({ length: 25 }, (_, i) => i).filter((i) => !st.revealed.includes(i));
    if (!avail.length) return;
    const choice = avail[Math.floor(Math.random() * avail.length)]!;
    void revealTile(choice);
  }

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
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="mines-count-range" className="font-semibold text-slate-300">
              Mines Count
            </label>
            <span className="num font-bold text-amber-300">{activeMines} / 24</span>
          </div>
          <input
            id="mines-count-range"
            type="range"
            min={1}
            max={24}
            disabled={!!st}
            value={activeMines}
            onChange={(e) => setMines(Number(e.target.value))}
            className="w-full cursor-pointer accent-emerald-400"
          />
        </div>

        <div className="rounded-lg border border-slate-700/70 bg-[#0f212e] p-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Next Gem Multiplier</span>
            <span className="num font-bold text-emerald-400">{nextMult.toFixed(2)}×</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-slate-400">
            <span>House Edge</span>
            <span className="num font-semibold text-slate-200">3.00% (97.0% RTP)</span>
          </div>
        </div>

        {st ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={pickRandom}
              className="h-9 w-full border-slate-700 bg-[#0f212e] text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Shuffle className="mr-1.5 h-3.5 w-3.5" />
              Pick Random Tile
            </Button>
            <Button
              type="button"
              disabled={pending || st.revealed.length === 0}
              onClick={() => {
                soundFx.win();
                void run({ type: "casinoMines", move: "cashout" });
              }}
              className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
            >
              Cash Out {money(st.bet * CASINO.chipValue * curMult)} ({curMult.toFixed(2)}×)
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            disabled={!canStart}
            onClick={() => {
              soundFx.chip();
              void run({ type: "casinoMines", move: "start", bet: betChips, mines });
            }}
            className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
          >
            Start Vault Round
          </Button>
        )}

        <GameOutcomeBanner cs={cs} gameKey="mines" />
      </div>

      {/* 5x5 Vault Tile Grid */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-700/80 bg-[#0f212e] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            {st ? `Safe Gems Found: ${st.revealed.length} / ${25 - st.mines}` : "5×5 Vault Grid"}
          </span>
          <span className="num font-bold text-emerald-400">Current: {curMult.toFixed(2)}×</span>
        </div>

        <div className="mx-auto grid w-full max-w-[420px] grid-cols-5 gap-2.5">
          {Array.from({ length: 25 }, (_, i) => {
            const isMine = last?.mines.includes(i);
            const open = revealed.includes(i);
            const exploded = last?.hit === i;
            return (
              <button
                key={i}
                type="button"
                disabled={!st || open || pending}
                onClick={() => void revealTile(i)}
                aria-label={`Tile ${i + 1}${open ? " safe gem" : isMine ? " mine" : ""}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl border-b-4 transition-all duration-150",
                  exploded
                    ? "scale-95 border-rose-700 bg-rose-600/85 text-white shadow-lg"
                    : isMine
                      ? "border-rose-900 bg-rose-950/75 text-rose-400"
                      : open
                        ? "scale-[1.02] border-emerald-700 bg-emerald-500/20 text-emerald-300"
                        : st
                          ? "border-slate-800 bg-[#213743] hover:-translate-y-0.5 hover:bg-[#2a4554] active:translate-y-0"
                          : "border-slate-800 bg-[#1a2c38] opacity-80",
                )}
              >
                {open ? (
                  <Gem className="h-6 w-6 text-emerald-400 animate-in zoom-in-75 duration-150" />
                ) : isMine ? (
                  <Bomb className="h-6 w-6 text-rose-400 animate-in zoom-in-75 duration-150" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="text-center text-xs text-slate-400">
          Reveal diamonds to raise the multiplier; cash out anytime before hitting a mine.
        </div>
      </div>
    </div>
  );
}
