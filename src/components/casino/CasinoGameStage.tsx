import type { ReactNode } from "react";
import { SLOT_BY_ID, type SlotId } from "@/game/slots";

type OriginalGameId = "dice" | "plinko" | "keno" | "crash" | "mines" | "chicken" | "hilo";
type StageId = OriginalGameId | `slot:${SlotId}`;

const ORIGINAL_STAGE: Record<OriginalGameId, {
  title: string;
  subtitle: string;
  status: string;
  motif: string;
  accent: string;
  glow: string;
}> = {
  dice: {
    title: "Precision Roll",
    subtitle: "Set your threshold. Watch the marker settle.",
    status: "TARGET CONTROL",
    motif: "⚄",
    accent: "text-sky-200",
    glow: "from-sky-500/25 via-blue-500/10",
  },
  plinko: {
    title: "The Drop Zone",
    subtitle: "A cascading peg field with a highlighted landing lane.",
    status: "PEG FIELD",
    motif: "✣",
    accent: "text-cyan-200",
    glow: "from-cyan-500/25 via-teal-500/10",
  },
  keno: {
    title: "Number Draw",
    subtitle: "Your picks meet the draw across a luminous number board.",
    status: "40-NUMBER DRAW",
    motif: "◉",
    accent: "text-violet-200",
    glow: "from-violet-500/25 via-fuchsia-500/10",
  },
  crash: {
    title: "Launch Control",
    subtitle: "Follow the server-confirmed round replay and target.",
    status: "ROUND REPLAY",
    motif: "🚀",
    accent: "text-orange-200",
    glow: "from-orange-500/25 via-rose-500/10",
  },
  mines: {
    title: "The Vault",
    subtitle: "Reveal safe gems. Keep hidden tiles concealed until resolved.",
    status: "5 × 5 VAULT",
    motif: "◆",
    accent: "text-emerald-200",
    glow: "from-emerald-500/25 via-lime-500/10",
  },
  chicken: {
    title: "Crossing Run",
    subtitle: "Advance lane by lane through the traffic corridor.",
    status: "15-LANE CROSSING",
    motif: "🐔",
    accent: "text-amber-200",
    glow: "from-amber-500/25 via-orange-500/10",
  },
  hilo: {
    title: "The Card Table",
    subtitle: "Read the next card and build your streak one choice at a time.",
    status: "LIVE DECK",
    motif: "♠",
    accent: "text-rose-200",
    glow: "from-rose-500/25 via-red-500/10",
  },
};

const SLOT_STAGE: Record<SlotId, { subtitle: string; motif: string; glow: string; accent: string }> = {
  classic_777: { subtitle: "A polished three-reel classic cabinet.", motif: "7", glow: "from-amber-500/25 via-yellow-500/10", accent: "text-amber-200" },
  olympus_thunder: { subtitle: "A mythic reel chamber charged with thunder.", motif: "⚡", glow: "from-sky-500/25 via-indigo-500/10", accent: "text-sky-200" },
  pharaoh_vault: { subtitle: "Ancient gold, hidden chambers and scarab symbols.", motif: "☥", glow: "from-yellow-600/25 via-orange-500/10", accent: "text-yellow-200" },
  neon_cyberspin: { subtitle: "A neon-lit digital cabinet with a synthwave pulse.", motif: "◈", glow: "from-fuchsia-500/25 via-cyan-500/10", accent: "text-fuchsia-200" },
  emerald_fortune: { subtitle: "A refined emerald cabinet with high-contrast gold trim.", motif: "♣", glow: "from-emerald-500/25 via-teal-500/10", accent: "text-emerald-200" },
  sugar_bonanza: { subtitle: "A bright candy cabinet filled with playful symbols.", motif: "✿", glow: "from-pink-500/25 via-purple-500/10", accent: "text-pink-200" },
};

export function CasinoGameStage({ game, children }: { game: StageId; children: ReactNode }) {
  const isSlot = game.startsWith("slot:");
  const slotId = isSlot ? (game.slice(5) as SlotId) : null;
  const original = !isSlot ? ORIGINAL_STAGE[game as OriginalGameId] : null;
  const slot = slotId ? SLOT_STAGE[slotId] : null;
  const title = original?.title ?? (slotId ? SLOT_BY_ID[slotId].name : "Casino");
  const subtitle = original?.subtitle ?? slot?.subtitle ?? "";
  const status = original?.status ?? "THEMED SLOT CABINET";
  const motif = original?.motif ?? slot?.motif ?? "✦";
  const accent = original?.accent ?? slot?.accent ?? "text-amber-200";
  const glow = original?.glow ?? slot?.glow ?? "from-amber-500/20 via-yellow-500/10";

  return (
    <section className="space-y-3" data-casino-stage={game}>
      <header className={`relative isolate overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br ${glow} to-[#091722] px-4 py-4 sm:px-6 sm:py-5`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-10 h-36 w-36 rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.035)_50%,transparent_80%)]" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={`mb-1 text-[10px] font-black tracking-[0.24em] ${accent}`}>{status}</div>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">{subtitle}</p>
          </div>
          <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/45 text-4xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] sm:h-20 sm:w-20 sm:text-5xl ${accent}`}>
            <span aria-hidden="true" className={game === "crash" || game === "chicken" ? "animate-bounce" : game === "slot:classic_777" || game === "slot:olympus_thunder" ? "animate-pulse" : ""}>{motif}</span>
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#10202b] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Game interface
          <span className="text-slate-600">/</span>
          <span>{isSlot ? "Dedicated slot theme" : "Dedicated game table"}</span>
        </div>
      </header>
      {children}
    </section>
  );
}
