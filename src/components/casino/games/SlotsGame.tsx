import { useEffect, useRef, useState } from "react";
import { Info, Sparkles } from "lucide-react";
import { CASINO } from "@/game/config";
import { casinoWalletDollars, type CasinoState } from "@/game/casino";
import { SLOT_BY_ID, SLOT_MACHINES, type SlotId, type SlotSpinResult } from "@/game/slots";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { SlotSymbolSvg } from "../casinoTextures";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

export function SlotsGame({
  cs,
  slotId,
  onSelectSlot,
}: {
  cs: CasinoState;
  slotId: SlotId;
  onSelectSlot: (id: SlotId) => void;
}) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [spinning, setSpinning] = useState(false);
  const [lockedCols, setLockedCols] = useState<number>(99);
  const [animGrid, setAnimGrid] = useState<string[][] | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const seenRoundRef = useRef<number>(cs.round);

  const def = SLOT_BY_ID[slotId];
  const lastResult = cs.last?.game === `slot:${slotId}` ? (cs.last.detail as SlotSpinResult) : null;

  // Build idle default grid if no result yet
  const defaultGrid: string[][] = Array.from({ length: def.rows }, (_, r) =>
    Array.from({ length: def.cols }, (_, c) => def.symbols[(r + c) % def.symbols.length]!.id),
  );

  // Trigger staggered reel spin animation whenever a new round result arrives
  useEffect(() => {
    if (cs.round !== seenRoundRef.current && cs.last?.game === `slot:${slotId}`) {
      seenRoundRef.current = cs.round;
      const result = cs.last.detail as SlotSpinResult;
      setSpinning(true);
      setLockedCols(0);

      const tickId = setInterval(() => {
        setAnimGrid(
          Array.from({ length: def.rows }, () =>
            Array.from(
              { length: def.cols },
              () => def.symbols[Math.floor(Math.random() * def.symbols.length)]!.id,
            ),
          ),
        );
      }, 65);

      const lockTimers: ReturnType<typeof setTimeout>[] = [];
      for (let col = 1; col <= def.cols; col++) {
        lockTimers.push(
          setTimeout(
            () => {
              soundFx.reelStop(col - 1);
              setLockedCols(col);
              if (col === def.cols) {
                clearInterval(tickId);
                setSpinning(false);
                setAnimGrid(null);
                if (result.totalMult > 0) soundFx.win(result.totalMult >= 10);
              }
            },
            260 + col * 145,
          ),
        );
      }

      return () => {
        clearInterval(tickId);
        lockTimers.forEach(clearTimeout);
      };
    }
  }, [cs.round, cs.last, slotId, def.rows, def.cols, def.symbols]);

  const targetGrid = lastResult?.grid ?? defaultGrid;
  const displayGrid = targetGrid.map((row, r) =>
    row.map((symId, c) => (spinning && c >= lockedCols ? (animGrid?.[r]?.[c] ?? symId) : symId)),
  );

  const winningCells = new Set<string>();
  if (!spinning && lastResult) {
    for (const wl of lastResult.winLines) {
      for (const [r, c] of wl.cells) winningCells.add(`${r}-${c}`);
    }
  }

  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);
  const canSpin =
    !pending &&
    !spinning &&
    betChips >= CASINO.minBet &&
    (Number(betUsd) || 0) <= walletUsd + 0.001;

  return (
    <div className="space-y-3">
      {/* Quick Slot Selector Strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SLOT_MACHINES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={spinning}
            onClick={() => {
              soundFx.click();
              onSelectSlot(m.id);
            }}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              m.id === slotId
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                : "border-slate-700/80 bg-[#1a2c38] text-slate-300 hover:border-slate-500",
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
        {/* Controls */}
        <div className="space-y-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-4">
          <BetAmountControl
            betUsd={betUsd}
            setBetUsd={setBetUsd}
            cs={cs}
            disabled={pending || spinning}
          />

          <div className="rounded-lg border border-slate-700/70 bg-[#0f212e] p-2.5 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>RTP / House Edge</span>
              <span className="num font-semibold text-slate-200">
                {def.rtp.toFixed(1)}% / {def.houseEdge.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Volatility · Max Win</span>
              <span className="num font-semibold text-amber-300">
                {def.volatility} · {def.maxWin}×
              </span>
            </div>
          </div>

          <Button
            type="button"
            disabled={!canSpin}
            onClick={() => {
              soundFx.roll();
              void run({ type: "casinoSlot", slotId, bet: betChips });
            }}
            className="h-12 w-full bg-emerald-500 text-sm font-extrabold text-slate-950 hover:bg-emerald-400"
          >
            {spinning ? "Spinning Reels..." : "SPIN REELS"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPaytable((v) => !v)}
            className="h-9 w-full border-slate-700 bg-[#0f212e] text-xs text-slate-200 hover:bg-slate-800"
          >
            <Info className="mr-1.5 h-3.5 w-3.5" />
            {showPaytable ? "Hide Paytable" : "View Paytable & Symbols"}
          </Button>

          <GameOutcomeBanner
            cs={cs}
            gameKey={`slot:${slotId}`}
            label={!spinning && lastResult?.bonusLabel ? lastResult.bonusLabel : undefined}
          />
        </div>

        {/* Cabinet & Reels Stage */}
        <div
          className={cn(
            "relative flex flex-col justify-between gap-4 rounded-xl border border-slate-700/80 bg-gradient-to-br p-5",
            def.bgGradient,
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-white">{def.name}</h2>
              <p className="text-xs text-slate-300/80">{def.subtitle}</p>
            </div>
            {!spinning && lastResult && lastResult.totalMult > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-400/20 px-3 py-1.5 text-amber-200 animate-in zoom-in-95 duration-200">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="num text-sm font-extrabold">
                  {lastResult.totalMult.toFixed(2)}× · {money(lastResult.payout * CASINO.chipValue)}
                </span>
              </div>
            )}
          </div>

          {/* Reel Grid */}
          <div
            className="mx-auto grid w-full max-w-[580px] gap-2 rounded-xl border-2 border-slate-700/80 bg-[#09151e]/90 p-3 shadow-inner"
            style={{ gridTemplateColumns: `repeat(${def.cols}, minmax(0, 1fr))` }}
          >
            {displayGrid.map((row, rIdx) =>
              row.map((symId, cIdx) => {
                const colSpinning = spinning && cIdx >= lockedCols;
                const isWin = winningCells.has(`${rIdx}-${cIdx}`);
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border transition-all duration-150",
                      isWin
                        ? "scale-105 border-amber-400 bg-amber-400/20 shadow-md"
                        : "border-slate-700/70 bg-[#132533]",
                      colSpinning && "opacity-75 translate-y-0.5 blur-[0.4px]",
                    )}
                  >
                    <SlotSymbolSvg symbolId={symId} size={def.cols === 3 ? 54 : 44} />
                  </div>
                );
              }),
            )}
          </div>

          {/* Paytable Drawer (when toggled) */}
          {showPaytable ? (
            <div className="grid gap-2 rounded-lg border border-slate-700/80 bg-[#09151e]/90 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {def.symbols.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 rounded-md border border-slate-800 bg-[#132533] p-2 text-xs"
                >
                  <SlotSymbolSvg symbolId={s.id} size={30} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{s.label}</div>
                    <div className="num text-[11px] text-slate-400">
                      {s.any6
                        ? `6+: ${s.any6}× · 8+: ${s.any8}× · 10+: ${s.any10}×`
                        : s.scatter3
                          ? `3×: ${s.scatter3}× · 4×: ${s.scatter4}× · 5×: ${s.scatter5}×`
                          : s.pay5
                            ? `3×: ${s.pay3}× · 4×: ${s.pay4}× · 5×: ${s.pay5}×`
                            : `3×: ${s.pay3}×${s.pay2 ? ` · 2×: ${s.pay2}×` : ""}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {!spinning && lastResult && lastResult.winLines.length > 0
                  ? `${lastResult.winLines.length} winning ${def.mode === "scatter_cluster" ? "cluster" : "payline"}${lastResult.winLines.length > 1 ? "s" : ""}`
                  : "Place stake and spin reels"}
              </span>
              <span className="num font-semibold text-slate-300">RTP {def.rtp.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
