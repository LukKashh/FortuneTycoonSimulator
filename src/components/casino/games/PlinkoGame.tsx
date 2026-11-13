import { useEffect, useRef, useState } from "react";
import { CASINO, type PlinkoRisk, type PlinkoRows } from "@/game/config";
import { casinoWalletDollars, type CasinoState } from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

type BallAnim = {
  path: number[];
  bucket: number;
  mult: number;
  startAt: number;
  rows: PlinkoRows;
  lastPegRow: number;
};

export function PlinkoGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [risk, setRisk] = useState<PlinkoRisk>("medium");
  const [rows, setRows] = useState<PlinkoRows>(12);
  const [recentHits, setRecentHits] = useState<{ mult: number; key: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<BallAnim[]>([]);
  const pegGlowRef = useRef<Map<string, number>>(new Map());
  const bucketGlowRef = useRef<Map<number, number>>(new Map());
  const seenRoundRef = useRef<number>(cs.round);

  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);
  const multipliers = CASINO.plinkoPay[risk][rows];

  useEffect(() => {
    if (cs.round !== seenRoundRef.current && cs.last?.game === "plinko") {
      seenRoundRef.current = cs.round;
      const d = cs.last.detail as {
        path: number[];
        bucket: number;
        mult: number;
        rows: PlinkoRows;
      };
      ballsRef.current.push({
        path: d.path,
        bucket: d.bucket,
        mult: d.mult,
        rows: d.rows,
        startAt: performance.now(),
        lastPegRow: -1,
      });
    }
  }, [cs.round, cs.last]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    const render = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 540;
      const h = canvas.clientHeight || 360;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const topPad = 28;
      const botPad = 48;
      const usableH = h - topPad - botPad;
      const rowStep = usableH / rows;
      const maxCols = rows + 2;
      const colSpacing = Math.min(34, (w - 40) / maxCols);
      const pegRadius = rows === 16 ? 3.2 : rows === 12 ? 3.8 : 4.6;

      // Draw Peg Pyramid
      for (let r = 0; r < rows; r++) {
        const cols = r + 3;
        const y = topPad + r * rowStep;
        for (let c = 0; c < cols; c++) {
          const x = w / 2 + (c - (cols - 1) / 2) * colSpacing;
          const glowUntil = pegGlowRef.current.get(`${r}-${c}`) ?? 0;
          const glowAmt = Math.max(0, (glowUntil - now) / 260);
          if (glowAmt > 0) {
            ctx.beginPath();
            ctx.arc(x, y, pegRadius + 5 * glowAmt, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(52, 211, 153, ${0.45 * glowAmt})`;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowAmt > 0 ? "#6ee7b7" : "#cbd5e1";
          ctx.fill();
        }
      }

      // Draw Bottom Multiplier Buckets
      const bucketCount = rows + 1;
      const bucketY = topPad + rows * rowStep + 6;
      const bucketW = Math.max(18, colSpacing - 4);
      for (let b = 0; b < bucketCount; b++) {
        const bx = w / 2 + (b - (bucketCount - 1) / 2) * colSpacing - bucketW / 2;
        const distCenter = Math.abs(b - (bucketCount - 1) / 2) / ((bucketCount - 1) / 2);
        const bg =
          distCenter > 0.72
            ? "#dc2626"
            : distCenter > 0.4
              ? "#ea580c"
              : distCenter > 0.16
                ? "#d97706"
                : "#ca8a04";
        const bGlow = Math.max(0, ((bucketGlowRef.current.get(b) ?? 0) - now) / 420);
        const yOffset = bGlow > 0 ? Math.sin(bGlow * Math.PI) * 5 : 0;

        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(bx, bucketY + yOffset, bucketW, 24, 5);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${rows === 16 ? 8.5 : 10}px JetBrains Mono, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const mVal = multipliers[b] ?? 0;
        ctx.fillText(`${mVal}×`, bx + bucketW / 2, bucketY + yOffset + 12.5);
      }

      // Update & Draw Active Falling Balls
      const stepDurationMs = rows === 16 ? 75 : 90;
      const nextBalls: BallAnim[] = [];
      for (const ball of ballsRef.current) {
        const elapsed = now - ball.startAt;
        const totalDur = ball.rows * stepDurationMs;
        if (elapsed >= totalDur) {
          bucketGlowRef.current.set(ball.bucket, now + 420);
          if (ball.mult >= 1.5) soundFx.win(ball.mult >= 5);
          else soundFx.pegHit(0.7);
          setRecentHits((prev) => [{ mult: ball.mult, key: Math.random() }, ...prev].slice(0, 8));
          continue;
        }
        nextBalls.push(ball);
        const progress = elapsed / stepDurationMs;
        const rIdx = Math.min(ball.rows - 1, Math.floor(progress));
        const frac = progress - rIdx;

        // Compute horizontal position before & after peg rIdx
        let sumBefore = 0;
        for (let i = 0; i < rIdx; i++) sumBefore += ball.path[i] ?? 0;
        const dir = ball.path[rIdx] ?? 0;
        const colBefore = 1 + sumBefore; // center of row 0 has 3 pegs (0, 1, 2)
        const colsCur = rIdx + 3;
        const pegX = w / 2 + (colBefore - (colsCur - 1) / 2) * colSpacing;

        if (rIdx > ball.lastPegRow) {
          ball.lastPegRow = rIdx;
          pegGlowRef.current.set(`${rIdx}-${colBefore}`, now + 260);
          soundFx.pegHit(0.9 + rIdx * 0.025);
        }

        const nextCol = colBefore + dir;
        const colsNext = rIdx + 4;
        const nextPegX = w / 2 + (nextCol - (colsNext - 1) / 2) * colSpacing;

        const y0 = topPad + rIdx * rowStep - 6;
        const y1 = topPad + (rIdx + 1) * rowStep - 6;
        // Parabolic bounce arc between pegs
        const bx = pegX + (nextPegX - pegX) * frac;
        const arc = Math.sin(frac * Math.PI) * 6;
        const by = y0 + (y1 - y0) * frac - arc;

        ctx.beginPath();
        ctx.arc(bx, by, pegRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = "#34d399";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ballsRef.current = nextBalls;
      ctx.restore();
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [rows, multipliers]);

  const canDrop =
    !pending && betChips >= CASINO.minBet && (Number(betUsd) || 0) <= walletUsd + 0.001;

  async function handleDrop() {
    if (!canDrop) return;
    soundFx.click();
    await run({ type: "casinoPlinko", bet: betChips, risk, rows });
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
      <div className="space-y-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-4">
        <BetAmountControl betUsd={betUsd} setBetUsd={setBetUsd} cs={cs} disabled={pending} />

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-300">Risk Level</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["low", "medium", "high"] as PlinkoRisk[]).map((r) => (
              <button
                key={r}
                type="button"
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

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-300">Rows</div>
          <div className="grid grid-cols-3 gap-1.5">
            {([8, 12, 16] as PlinkoRows[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRows(r)}
                className={cn(
                  "num rounded-md py-1.5 text-xs font-semibold transition-colors",
                  rows === r
                    ? "bg-sky-500 text-slate-950"
                    : "bg-[#0f212e] text-slate-300 hover:bg-slate-800",
                )}
              >
                {r} Rows
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-[#0f212e] px-3 py-2 text-xs text-slate-400">
          <span>House Edge</span>
          <span className="num font-semibold text-slate-200">1.50% (~98.5% RTP)</span>
        </div>

        <Button
          type="button"
          disabled={!canDrop}
          onClick={() => void handleDrop()}
          className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          Drop Plinko Ball
        </Button>

        <GameOutcomeBanner cs={cs} gameKey="plinko" />
      </div>

      {/* Plinko Peg Canvas */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-700/80 bg-[#0f212e] p-4">
        <div className="flex min-h-7 items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400">Live Peg Board</span>
          <div className="flex flex-wrap justify-end gap-1">
            {recentHits.map((h) => (
              <span
                key={h.key}
                className={cn(
                  "num rounded px-1.5 py-0.5 text-[11px] font-bold",
                  h.mult >= 2
                    ? "bg-emerald-500/20 text-emerald-300"
                    : h.mult >= 1
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-800 text-slate-400",
                )}
              >
                {h.mult}×
              </span>
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          data-testid="plinko-canvas"
          className="h-[340px] w-full rounded-lg bg-[#09151e]"
        />
      </div>
    </div>
  );
}
