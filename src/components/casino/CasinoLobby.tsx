import { useState } from "react";
import { ArrowLeft, Volume2, VolumeX, Wallet } from "lucide-react";
import { CASINO_DENOMINATIONS } from "@/game/config";
import { casinoWalletDollars, chipBreakdown, type CasinoState } from "@/game/casino";
import { SLOT_MACHINES, type SlotId } from "@/game/slots";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CasinoChipSvg, GameCoverArt } from "./casinoTextures";
import { WalletModal } from "./WalletModal";
import { DiceGame } from "./games/DiceGame";
import { PlinkoGame } from "./games/PlinkoGame";
import { KenoGame } from "./games/KenoGame";
import { CrashGame } from "./games/CrashGame";
import { MinesGame } from "./games/MinesGame";
import { ChickenGame } from "./games/ChickenGame";
import { HiloGame } from "./games/HiloGame";
import { SlotsGame } from "./games/SlotsGame";
import { soundFx } from "./soundFx";
import { cn } from "@/lib/utils";

export type OriginalId = "dice" | "plinko" | "keno" | "crash" | "mines" | "chicken" | "hilo";
export type CasinoRouteView = "lobby" | OriginalId | `slot:${SlotId}`;

type OriginalMeta = {
  id: OriginalId;
  name: string;
  tagline: string;
  rtp: string;
  edge: string;
};

const ORIGINALS: OriginalMeta[] = [
  {
    id: "dice",
    name: "Dice",
    tagline: "Adjustable Roll Over/Under",
    rtp: "99.0% RTP",
    edge: "1.0% Edge",
  },
  {
    id: "plinko",
    name: "Plinko",
    tagline: "8–16 Row Peg Drop",
    rtp: "98.5% RTP",
    edge: "1.5% Edge",
  },
  {
    id: "keno",
    name: "Keno",
    tagline: "40-Orb Multi-Risk Draw",
    rtp: "97.0% RTP",
    edge: "3.0% Edge",
  },
  {
    id: "crash",
    name: "Crash",
    tagline: "Live Rocket Multiplier",
    rtp: "97.0% RTP",
    edge: "3.0% Edge",
  },
  {
    id: "mines",
    name: "Mines",
    tagline: "5×5 Vault Gem Sweep",
    rtp: "97.0% RTP",
    edge: "3.0% Edge",
  },
  {
    id: "chicken",
    name: "Chicken",
    tagline: "15-Lane Road Crossing",
    rtp: "97.0% RTP",
    edge: "3.0% Edge",
  },
  {
    id: "hilo",
    name: "Hi-Lo",
    tagline: "Live Card Streak Deck",
    rtp: "97.0% RTP",
    edge: "3.0% Edge",
  },
];

export function CasinoHub({ cash, cs }: { cash: number; cs: CasinoState }) {
  const [view, setView] = useState<CasinoRouteView>("lobby");
  const [filter, setFilter] = useState<"all" | "originals" | "slots">("all");
  const [walletOpen, setWalletOpen] = useState(false);
  const [muted, setMuted] = useState(soundFx.isMuted());

  const activeLockedView: CasinoRouteView | null = cs.active
    ? cs.active.game === "mines"
      ? "mines"
      : cs.active.game === "chicken"
        ? "chicken"
        : cs.active.game === "hilo"
          ? "hilo"
          : null
    : null;

  const currentView = activeLockedView ?? view;
  const walletUsd = casinoWalletDollars(cs);
  const breakdown = cs.denoms ?? chipBreakdown(walletUsd);

  const toggleMute = () => {
    const next = !muted;
    soundFx.setMuted(next);
    setMuted(next);
  };

  const openGame = (next: CasinoRouteView) => {
    if (activeLockedView) return;
    soundFx.click();
    setView(next);
  };

  const netUsd = (cs.stats.won - cs.stats.wagered) * 100;

  return (
    <div className="space-y-4 pb-6">
      {/* Top Casino Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-[#1a2c38] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {currentView !== "lobby" && !activeLockedView ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openGame("lobby")}
              className="h-9 border-slate-700 bg-[#0f212e] px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 whitespace-nowrap"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Casino Lobby
            </Button>
          ) : (
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                Capitalfortune Casino
              </h1>
            </div>
          )}
          {activeLockedView && (
            <span className="text-xs font-semibold text-amber-300">Active round in progress</span>
          )}
        </div>

        {/* Digital Chip Wallet Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/80 bg-[#0f212e] px-3 py-1.5">
            <div className="flex items-center gap-2">
              {CASINO_DENOMINATIONS.map((d) => (
                <div
                  key={d}
                  className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300"
                >
                  <CasinoChipSvg denom={d} size={20} />
                  <span className="num font-semibold">{breakdown[d] ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div>
              <div className="text-[10px] text-slate-400">Chip Wallet</div>
              <div className="num text-sm font-extrabold text-emerald-400">{money(walletUsd)}</div>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              soundFx.click();
              setWalletOpen(true);
            }}
            className="h-10 bg-emerald-500 px-4 text-xs font-bold text-slate-950 hover:bg-emerald-400 whitespace-nowrap"
          >
            <Wallet className="mr-1.5 h-4 w-4" />
            Wallet / Top Up
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleMute}
            aria-label={muted ? "Unmute casino audio" : "Mute casino audio"}
            className="h-10 w-10 border-slate-700 bg-[#0f212e] text-slate-200 hover:bg-slate-800"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area: Lobby vs Active Game */}
      {currentView === "lobby" ? (
        <div className="space-y-5">
          {/* Featured Casino Hero */}
          <section className="grid gap-4 rounded-xl border border-slate-700/80 bg-gradient-to-br from-[#1a2c38] via-[#132533] to-[#0f212e] p-5 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-emerald-400">
                Originals · Video Slots · Unified Digital Chip Wallet
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl text-balance">
                Play 7 Animated Originals &amp; 6 Custom Slot Machines
              </h2>
              <p className="max-w-xl text-sm text-slate-300">
                Convert empire cash into $100, $1,000, and $5,000 casino chips with zero fees. Every
                round resolves on the server with calibrated house edges from 1.0% to 3.7%.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {walletUsd < 100 ? (
                  <Button
                    type="button"
                    onClick={() => setWalletOpen(true)}
                    className="h-10 bg-emerald-500 px-5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                  >
                    Top Up Casino Chips
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => openGame("crash")}
                    className="h-10 bg-emerald-500 px-5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                  >
                    Launch Crash
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openGame("slot:olympus_thunder")}
                  className="h-10 border-slate-600 bg-[#0f212e] px-4 text-xs font-semibold text-slate-100 hover:bg-slate-800"
                >
                  Spin Olympus Thunder
                </Button>
              </div>
            </div>

            {/* 3 Denomination Showcase */}
            <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-slate-700/70 bg-[#0f212e]/90 p-3">
              {CASINO_DENOMINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWalletOpen(true)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-700/70 bg-[#1a2c38] p-2.5 text-center transition-colors hover:border-emerald-400/60"
                >
                  <CasinoChipSvg denom={d} size={44} />
                  <span className="num text-xs font-bold text-white">${d.toLocaleString()}</span>
                  <span className="num text-[11px] text-slate-400">{breakdown[d] ?? 0} held</span>
                </button>
              ))}
            </div>
          </section>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex gap-1 rounded-lg border border-slate-700/80 bg-[#1a2c38] p-1">
              {(
                [
                  { id: "all", label: "All Games (13)" },
                  { id: "originals", label: "Originals (7)" },
                  { id: "slots", label: "Slots (6)" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                    filter === t.id
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-300 hover:text-white",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7 Originals Showcase */}
          {(filter === "all" || filter === "originals") && (
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-bold text-white">Originals</h3>
                <span className="text-xs text-slate-400">1.0% – 3.0% House Edge</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ORIGINALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => openGame(g.id)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-[#1a2c38] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400/70"
                  >
                    <GameCoverArt id={g.id} />
                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300">
                        {g.name}
                      </span>
                      <span className="num text-[11px] font-semibold text-emerald-400">
                        {g.rtp}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {g.tagline} · {g.edge}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 6 Slot Games Showcase */}
          {(filter === "all" || filter === "slots") && (
            <section className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-bold text-white">Slot Machines</h3>
                <span className="text-xs text-slate-400">6 Distinct Themes · ~96.5% RTP</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SLOT_MACHINES.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => openGame(`slot:${slot.id}`)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-[#1a2c38] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400/70"
                  >
                    <GameCoverArt id={slot.id} />
                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold text-white group-hover:text-amber-300">
                        {slot.name}
                      </span>
                      <span className="num shrink-0 text-[11px] font-semibold text-amber-300">
                        {slot.rtp.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {slot.volatility} · {slot.houseEdge.toFixed(1)}% Edge · Max {slot.maxWin}×
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Session Summary Strip */}
          <section className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-700/80 bg-[#1a2c38] p-3.5 sm:grid-cols-4">
            <div>
              <div className="text-[11px] text-slate-400">Rounds Played</div>
              <div className="num mt-0.5 text-base font-bold text-white">
                {cs.stats.rounds.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Total Wagered</div>
              <div className="num mt-0.5 text-base font-bold text-slate-100">
                {money(cs.stats.wagered * 100)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Net Profit</div>
              <div
                className={cn(
                  "num mt-0.5 text-base font-bold",
                  netUsd >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {netUsd >= 0 ? "+" : ""}
                {money(netUsd)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Biggest Win</div>
              <div className="num mt-0.5 text-base font-bold text-amber-300">
                {money(cs.stats.biggestWin * 100)}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Quick Game Switcher while playing (disabled if active round) */}
          {!activeLockedView && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {ORIGINALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => openGame(g.id)}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    currentView === g.id
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                      : "border-slate-700/80 bg-[#1a2c38] text-slate-300 hover:border-slate-500",
                  )}
                >
                  {g.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => openGame("slot:classic_777")}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  currentView.startsWith("slot:")
                    ? "border-amber-400 bg-amber-500/15 text-amber-300"
                    : "border-slate-700/80 bg-[#1a2c38] text-slate-300 hover:border-slate-500",
                )}
              >
                Slots (6)
              </button>
            </div>
          )}

          {currentView === "dice" && <DiceGame cs={cs} />}
          {currentView === "plinko" && <PlinkoGame cs={cs} />}
          {currentView === "keno" && <KenoGame cs={cs} />}
          {currentView === "crash" && <CrashGame cs={cs} />}
          {currentView === "mines" && <MinesGame cs={cs} />}
          {currentView === "chicken" && <ChickenGame cs={cs} />}
          {currentView === "hilo" && <HiloGame cs={cs} />}
          {currentView.startsWith("slot:") && (
            <SlotsGame
              cs={cs}
              slotId={currentView.replace("slot:", "") as SlotId}
              onSelectSlot={(id) => openGame(`slot:${id}`)}
            />
          )}
        </div>
      )}

      <WalletModal open={walletOpen} onOpenChange={setWalletOpen} cash={cash} cs={cs} />
    </div>
  );
}
