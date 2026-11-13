import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { CASINO } from "@/game/config";
import { casinoWalletDollars, type CasinoState } from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BetAmountControl, GameOutcomeBanner } from "../BetControls";
import { soundFx } from "../soundFx";
import { cn } from "@/lib/utils";

export function CrashGame({ cs }: { cs: CasinoState }) {
  const { run, pending } = useAct();
  const [betUsd, setBetUsd] = useState("100");
  const [targetMultStr, setTargetMultStr] = useState("2.00");
  const [turbo, setTurbo] = useState(false);
  const [flying, setFlying] = useState(false);
  const [liveMult, setLiveMult] = useState(1.0);
  const [flightStatus, setFlightStatus] = useState<"idle" | "flying" | "won" | "crashed">("idle");
  const [history, setHistory] = useState<{ point: number; won: boolean }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<{
    crashPoint: number;
    targetMult: number;
    won: boolean;
    startAt: number;
    endMult: number;
    durationMs: number;
  } | null>(null);
  const seenRoundRef = useRef<number>(cs.round);

  const targetMult = Math.max(1.01, Math.min(CASINO.crashMaxMult, Number(targetMultStr) || 2.0));
  const betChips = (Number(betUsd) || 0) / CASINO.chipValue;
  const walletUsd = casinoWalletDollars(cs);

  useEffect(() => {
    if (cs.round !== seenRoundRef.current && cs.last?.game === "crash") {
      seenRoundRef.current = cs.round;
      const d = cs.last.detail as { crashPoint: number; targetMult: number; won: boolean };
      const endMult = d.won ? d.targetMult : d.crashPoint;
      const baseDur = Math.min(3400, Math.max(450, Math.log(Math.max(1.05, endMult)) * 1800));
      const durationMs = turbo ? Math.min(480, baseDur * 0.3) : baseDur;
      animRef.current = {
        crashPoint: d.crashPoint,
        targetMult: d.targetMult,
        won: d.won,
        startAt: performance.now(),
        endMult,
        durationMs,
      };
      setFlying(true);
      setFlightStatus("flying");
    }
  }, [cs.round, cs.last, turbo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 540;
      const h = canvas.clientHeight || 300;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Background subtle grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = h - (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
      }

      const anim = animRef.current;
      let curMult = 1.0;
      let tNorm = 0;
      let done = false;
      if (anim) {
        tNorm = Math.min(1, (now - anim.startAt) / anim.durationMs);
        const eased = Math.pow(tNorm, 1.35);
        curMult = 1 + (anim.endMult - 1) * eased;
        setLiveMult(Math.round(curMult * 100) / 100);
        if (tNorm >= 1) {
          done = true;
          animRef.current = null;
          setFlying(false);
          setLiveMult(anim.won ? anim.targetMult : anim.crashPoint);
          setFlightStatus(anim.won ? "won" : "crashed");
          if (anim.won) soundFx.win(anim.targetMult >= 5);
          else soundFx.bust();
          setHistory((prev) => [{ point: anim.crashPoint, won: anim.won }, ...prev].slice(0, 10));
        }
      }

      // Draw Exponential Curve
      const padL = 34;
      const padR = 34;
      const padB = 30;
      const padT = 36;
      const usableW = w - padL - padR;
      const usableH = h - padT - padB;
      const progress = anim ? tNorm : flightStatus === "idle" ? 0 : 1;

      if (progress > 0) {
        const endX = padL + usableW * (0.15 + 0.78 * progress);
        const endY = h - padB - usableH * Math.pow(progress, 1.45);

        const grad = ctx.createLinearGradient(padL, h - padB, endX, endY);
        const isLoss = flightStatus === "crashed" || (done && anim && !anim.won);
        grad.addColorStop(0, isLoss ? "rgba(244,63,94,0.12)" : "rgba(16,185,129,0.12)");
        grad.addColorStop(1, isLoss ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.42)");

        ctx.beginPath();
        ctx.moveTo(padL, h - padB);
        ctx.quadraticCurveTo(padL + usableW * 0.45 * progress, h - padB, endX, endY);
        ctx.lineTo(endX, h - padB);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(padL, h - padB);
        ctx.quadraticCurveTo(padL + usableW * 0.45 * progress, h - padB, endX, endY);
        ctx.strokeStyle = isLoss ? "#fb7185" : "#34d399";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();

        // Rocket Head / Explosion
        ctx.beginPath();
        ctx.arc(endX, endY, isLoss ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = isLoss ? "#ef4444" : "#facc15";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [flightStatus]);

  const canLaunch =
    !pending &&
    !flying &&
    betChips >= CASINO.minBet &&
    (Number(betUsd) || 0) <= walletUsd + 0.001 &&
    targetMult >= 1.01;

  return (
    <div className="grid gap-3 lg:grid-cols-[310px_1fr]">
      <div className="space-y-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-4">
        <BetAmountControl
          betUsd={betUsd}
          setBetUsd={setBetUsd}
          cs={cs}
          disabled={pending || flying}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="crash-target-mult" className="font-semibold text-slate-300">
              Auto Cashout Target (×)
            </label>
            <span className="num text-slate-400">
              Win: {money((Number(betUsd) || 0) * targetMult)}
            </span>
          </div>
          <Input
            id="crash-target-mult"
            inputMode="decimal"
            disabled={pending || flying}
            value={targetMultStr}
            onChange={(e) => setTargetMultStr(e.target.value.replace(/[^\d.]/g, ""))}
            className="num h-10 border-slate-700 bg-[#0f212e] font-semibold text-white"
          />
          <div className="grid grid-cols-4 gap-1.5">
            {["1.50", "2.00", "5.00", "10.00"].map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={flying}
                onClick={() => setTargetMultStr(preset)}
                className="num rounded border border-slate-700/80 bg-[#0f212e] py-1 text-[11px] font-semibold text-slate-300 hover:border-slate-500"
              >
                {preset}×
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-[#0f212e] px-3 py-2 text-xs">
          <span className="text-slate-400">House Edge · 97.0% RTP</span>
          <button
            type="button"
            onClick={() => setTurbo((t) => !t)}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-semibold",
              turbo ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300",
            )}
          >
            {turbo ? "Turbo On" : "Normal Speed"}
          </button>
        </div>

        <Button
          type="button"
          disabled={!canLaunch}
          onClick={() => {
            soundFx.roll();
            void run({ type: "casinoCrash", bet: betChips, targetMult });
          }}
          className="h-11 w-full bg-emerald-500 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          <Rocket className="mr-1.5 h-4 w-4" />
          {flying ? "Ascending..." : `Launch (${targetMult.toFixed(2)}×)`}
        </Button>

        <GameOutcomeBanner cs={cs} gameKey="crash" />
      </div>

      {/* Live Crash Curve Viewport */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-700/80 bg-[#0f212e] p-4">
        <div className="flex min-h-7 items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400">Recent Crash Points</span>
          <div className="flex flex-wrap justify-end gap-1">
            {history.length === 0 ? (
              <span className="text-xs text-slate-500">Launch to start flight log</span>
            ) : (
              history.map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    "num rounded px-2 py-0.5 text-xs font-bold",
                    h.point >= 2
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300",
                  )}
                >
                  {h.point.toFixed(2)}×
                </span>
              ))
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-[#09151e]">
          <canvas ref={canvasRef} data-testid="crash-canvas" className="h-[300px] w-full" />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={cn(
                "num text-5xl font-extrabold tracking-tight",
                flightStatus === "crashed"
                  ? "text-rose-400"
                  : flightStatus === "won"
                    ? "text-emerald-400"
                    : "text-white",
              )}
            >
              {liveMult.toFixed(2)}×
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-400">
              {flightStatus === "crashed"
                ? `Crashed at ${liveMult.toFixed(2)}×`
                : flightStatus === "won"
                  ? `Cashed out at ${liveMult.toFixed(2)}×`
                  : flightStatus === "flying"
                    ? `Climbing toward ${targetMult.toFixed(2)}×...`
                    : `Ready for launch · Target ${targetMult.toFixed(2)}×`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
