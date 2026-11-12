import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Menu, Wallet } from "lucide-react";
import { useClicker, useGame, useOptimisticTaps } from "@/hooks/use-game";
import { clickBase, clickReq, mult, personalMods, xpForLevel } from "@/game/engine";
import { corpMods } from "@/game/corp";
import { BALANCE } from "@/game/config";
import { money } from "@/lib/format";
import { Loading } from "@/components/game/ui";
import { getPlayerTier } from "@/components/game/art";
import { useMenu } from "@/context/menu";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Clicker — Capitalfortune" },
      { name: "description", content: "Tap to earn your fortune." },
      { property: "og:title", content: "Clicker — Capitalfortune" },
      { property: "og:description", content: "Tap to earn your fortune." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

type PopItem = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  wave: number;
  rotStart: number;
  rotEnd: number;
  scale: number;
  duration: number;
};

function HomePage() {
  const { data } = useGame();
  const { openMenu } = useMenu();
  const p = useMemo(() => (data ? personalMods(data.state) : null), [data]);
  const cm = useMemo(() => (data ? corpMods(data.corp) : null), [data]);
  const value = useMemo(
    () => (data && p && cm ? clickBase(data.state.clicker.level) * mult("clickPct", p, cm) : 0),
    [data, p, cm],
  );
  const { tap, buffer } = useClicker();
  const opt = useOptimisticTaps(data, value);
  const [pops, setPops] = useState<PopItem[]>([]);
  const popId = useRef(0);
  const lastRewardEffectAt = useRef(0);
  if (!data || !p || !cm) return <Loading />;
  const s = data.state;
  const req = clickReq(s.clicker.level);
  const maxed = s.clicker.level >= BALANCE.clicker.hardCap;
  const shownCount = maxed ? 0 : Math.min(req, s.clicker.count + buffer);
  const tierInfo = getPlayerTier(s.level);
  const xpPct = Math.min(100, ((s.xp + opt.xp) / xpForLevel(s.level)) * 100);
  const liveBalance = s.cash + opt.cash;

  const createPop = (x: number, y: number): PopItem => {
    const id = ++popId.current;
    return {
      id,
      x,
      y,
      dx: (Math.random() - 0.5) * 18,
      dy: -54,
      wave: 0,
      rotStart: 0,
      rotEnd: (Math.random() - 0.5) * 8,
      scale: 0.94 + Math.random() * 0.08,
      duration: 680,
    };
  };

  const triggerTapFeedback = (x: number, y: number) => {
    tap();

    const now = performance.now();
    if (now - lastRewardEffectAt.current < 125) return;
    lastRewardEffectAt.current = now;

    const pop = createPop(x, y);
    setPops((list) => [...list.slice(-3), pop]);
    setTimeout(
      () => setPops((list) => list.filter((item) => item.id !== pop.id)),
      pop.duration + 40,
    );
  };

  const handleFramePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    triggerTapFeedback(x, y);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      triggerTapFeedback(rect.width / 2, rect.height / 2);
    }
  };

  return (
    <div className="tapper-scene flex h-full flex-col justify-between overflow-hidden pb-1">
      {/* Unified Clicker UI Container */}
      <div className="home-clicker-frame relative w-full flex-1 min-h-[260px] rounded-2xl border border-primary/30 bg-[#0b0b15] shadow-[0_18px_48px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col justify-between overflow-hidden">
        {/* Integrated Cut-Out Header Shapes Layered on Top of Tap UI */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Left Cut-Out Shape: User Identity Chip + All Existing Values & Balance */}
          <Link
            to="/profile"
            title="Profile & Settings"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto relative flex items-center gap-2.5 rounded-br-2xl border-b-2 border-r-2 border-primary-glow/45 bg-[#111122]/95 pl-3 pr-4 py-2 shadow-[6px_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-colors hover:border-primary-glow max-w-[76%]"
          >
            <div className="relative h-9 w-9 shrink-0 rounded-xl border border-primary-glow/60 bg-gradient-to-b from-primary/20 to-card/70 p-0.5 flex items-center justify-center overflow-hidden shadow-inner">
              <img
                src={tierInfo.badgePath}
                alt={tierInfo.tierName}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-xs font-extrabold tracking-tight text-foreground">
                  {s.username || "Tycoon"}
                </span>
                <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-primary-glow">
                  LV {s.level}
                </span>
                <span className="hidden sm:inline shrink-0 text-[9px] font-semibold text-muted-foreground">
                  · {tierInfo.tierName}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <Wallet className="h-3 w-3 shrink-0 text-gold" />
                <span className="num text-xs sm:text-sm font-extrabold text-gain tracking-tight">
                  {money(liveBalance)}
                </span>
                {opt.cash > 0 && (
                  <span className="num text-[9px] font-mono font-bold text-primary-glow">
                    (+{money(opt.cash)})
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Right Cut-Out Shape: Menu Tab */}
          <button
            type="button"
            aria-label="Open Menu"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              openMenu();
            }}
            className="pointer-events-auto relative flex items-center gap-1.5 rounded-bl-2xl border-b-2 border-l-2 border-primary-glow/45 bg-[#111122]/95 px-3.5 py-2.5 text-xs font-bold text-foreground shadow-[-6px_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-colors hover:border-primary-glow hover:text-primary-glow"
          >
            <Menu className="h-4 w-4 text-primary-glow" />
            <span className="tracking-wider uppercase text-[10px]">Menu</span>
          </button>
        </div>

        <div
          onPointerDown={handleFramePointerDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Tap anywhere within frame to generate wealth"
          className="home-tap-surface relative flex-1 w-full select-none cursor-pointer overflow-hidden touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-glow flex items-center justify-center group"
        >
          <div className="pointer-events-none absolute inset-2 rounded-xl border border-primary/15" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-primary-glow/80" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-primary-glow/80" />

          <div className="home-tap-center pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2.5 pt-8">
            <div className="home-tap-orbit absolute rounded-full" />
            <div className="home-tap-medallion relative flex items-center justify-center">
              <div className="home-tap-medallion-glint absolute inset-0 rounded-full" />
              <img
                src="/assets/aistudio/file_000000001f808246b3f630ace71f936f_d89c4e38.png"
                alt=""
                draggable={false}
                className="home-tap-coin relative z-[1] h-full w-full select-none object-contain"
              />
            </div>
            <span className="home-tap-label relative z-[2] text-[10px] sm:text-xs font-extrabold tracking-[0.22em] text-foreground/85">
              TAP TO EARN
            </span>
          </div>

          {pops.map((pp) => (
            <div
              key={pp.id}
              className="home-tap-reward pointer-events-none absolute z-30"
              style={
                {
                  left: pp.x,
                  top: pp.y,
                  "--drift-x": `${pp.dx}px`,
                  "--drift-y": `${pp.dy}px`,
                  "--wave-x": `${pp.wave}px`,
                  "--rot-start": `${pp.rotStart}deg`,
                  "--rot-end": `${pp.rotEnd}deg`,
                  "--anim-scale": pp.scale,
                  "--anim-duration": `${pp.duration}ms`,
                } as React.CSSProperties
              }
            >
              <div className="float-cash-text num font-bold text-xs sm:text-sm text-gain whitespace-nowrap drop-shadow-[0_0_8px_rgba(34,197,94,0.9)]">
                +{money(value)}
              </div>
              <div className="float-small-coin home-reward-coin relative">
                <img
                  src="/assets/aistudio/file_000000001f808246b3f630ace71f936f_d89c4e38.png"
                  alt=""
                  draggable={false}
                  className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Compact Bottom Status Strip */}
        <div className="home-clicker-footer shrink-0 w-full border-t border-white/[0.07] bg-[#10101b]/95 px-3 py-2 text-left backdrop-blur-xl flex items-center justify-between gap-2 z-10 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Per Tap:</span>
            <span className="num font-bold text-gain">+{money(value)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>Next LV:</span>
            <span className="num font-bold text-primary-glow">
              {maxed ? "MAX" : `${Math.max(0, req - shownCount).toLocaleString()} taps`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
