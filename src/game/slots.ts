// Pure, deterministic slot machine definitions and evaluation for Capitalfortune Casino.
// All 6 machines use calibrated symbol weights and payout tables targeting ~96.2%–96.7% RTP (3.3%–3.8% house edge).

export type SlotId =
  | "classic_777"
  | "olympus_thunder"
  | "pharaoh_vault"
  | "neon_cyberspin"
  | "emerald_fortune"
  | "sugar_bonanza";

export type SlotSymbolDef = {
  id: string;
  label: string;
  weight: number;
  isWild?: boolean;
  isScatter?: boolean;
  accent: string;
  // Line pays in total-bet multipliers
  pay2?: number;
  pay3?: number;
  pay4?: number;
  pay5?: number;
  // Scatter / Pay-anywhere count pays in total-bet multipliers
  scatter3?: number;
  scatter4?: number;
  scatter5?: number;
  any6?: number;
  any8?: number;
  any10?: number;
};

export type SlotMachineDef = {
  id: SlotId;
  name: string;
  subtitle: string;
  rows: 3 | 4;
  cols: 3 | 5;
  mode: "lines" | "scatter_cluster";
  rtp: number; // documented theoretical RTP (%)
  houseEdge: number; // documented house edge (%)
  volatility: "Low-Med" | "Medium" | "Med-High" | "High";
  maxWin: number;
  wildMult?: number;
  accent: string;
  bgGradient: string;
  symbols: SlotSymbolDef[];
};

export type SlotWinLine = {
  lineIndex: number;
  symbolId: string;
  count: number;
  payoutMult: number;
  cells: [number, number][];
};

export type SlotSpinResult = {
  slotId: SlotId;
  grid: string[][]; // [row][col] of symbol IDs
  totalMult: number;
  payout: number;
  winLines: SlotWinLine[];
  scatterCount: number;
  scatterMult: number;
  bonusLabel?: string;
};

export const LINES_3X3: [number, number][][] = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [2, 0],
    [1, 1],
    [0, 2],
  ],
];

export const LINES_5X3: [number, number][][] = [
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
    [1, 3],
    [0, 4],
  ],
  [
    [2, 0],
    [1, 1],
    [0, 2],
    [1, 3],
    [2, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
  ],
  [
    [2, 0],
    [2, 1],
    [1, 2],
    [0, 3],
    [0, 4],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [1, 4],
  ],
  [
    [1, 0],
    [2, 1],
    [1, 2],
    [0, 3],
    [1, 4],
  ],
  [
    [0, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [0, 4],
  ],
];

export const SLOT_MACHINES: SlotMachineDef[] = [
  {
    id: "classic_777",
    name: "Diamond 777 Classic",
    subtitle: "3x3 Luxury Stepper · 5 Paylines",
    rows: 3,
    cols: 3,
    mode: "lines",
    rtp: 96.7,
    houseEdge: 3.3,
    volatility: "Medium",
    maxWin: 240,
    accent: "#ef4444",
    bgGradient: "from-rose-950/80 via-slate-900 to-amber-950/40",
    symbols: [
      { id: "diamond", label: "Diamond", weight: 4, accent: "#38bdf8", pay3: 48 },
      { id: "seven", label: "Triple 7", weight: 7, accent: "#ef4444", pay3: 21 },
      { id: "bell", label: "Golden Bell", weight: 11, accent: "#facc15", pay3: 10.5 },
      { id: "bar", label: "Gold Bar", weight: 16, accent: "#fbbf24", pay3: 5.7 },
      { id: "clover", label: "Clover", weight: 24, accent: "#22c55e", pay3: 3.05 },
      { id: "cherry", label: "Cherry", weight: 38, accent: "#f43f5e", pay2: 0.27, pay3: 1.45 },
    ],
  },
  {
    id: "olympus_thunder",
    name: "Olympus Thunder",
    subtitle: "5x3 Mythic Arena · 10 Paylines + Lightning Scatters",
    rows: 3,
    cols: 5,
    mode: "lines",
    rtp: 96.3,
    houseEdge: 3.7,
    volatility: "High",
    maxWin: 150,
    accent: "#38bdf8",
    bgGradient: "from-sky-950/80 via-slate-900 to-indigo-950/60",
    symbols: [
      {
        id: "zeus_crown",
        label: "Zeus Crown",
        weight: 5,
        accent: "#facc15",
        pay3: 0.81,
        pay4: 2.85,
        pay5: 14.3,
      },
      {
        id: "lightning",
        label: "Thunder Scatter",
        weight: 11,
        isScatter: true,
        accent: "#38bdf8",
        scatter3: 1.18,
        scatter4: 5.2,
        scatter5: 22.8,
      },
      {
        id: "trident",
        label: "Trident",
        weight: 10,
        accent: "#60a5fa",
        pay3: 0.43,
        pay4: 1.56,
        pay5: 6.7,
      },
      {
        id: "chalice",
        label: "Chalice",
        weight: 14,
        accent: "#fbbf24",
        pay3: 0.27,
        pay4: 0.81,
        pay5: 3.6,
      },
      {
        id: "hourglass",
        label: "Hourglass",
        weight: 18,
        accent: "#a78bfa",
        pay3: 0.15,
        pay4: 0.48,
        pay5: 1.9,
      },
      {
        id: "gem_blue",
        label: "Sapphire",
        weight: 20,
        accent: "#0ea5e9",
        pay3: 0.1,
        pay4: 0.27,
        pay5: 0.95,
      },
      {
        id: "gem_purple",
        label: "Amethyst",
        weight: 22,
        accent: "#c084fc",
        pay3: 0.08,
        pay4: 0.21,
        pay5: 0.76,
      },
    ],
  },
  {
    id: "pharaoh_vault",
    name: "Pharaoh's Vault",
    subtitle: "5x3 Royal Tomb · 10 Paylines + Scarab Wilds",
    rows: 3,
    cols: 5,
    mode: "lines",
    rtp: 96.5,
    houseEdge: 3.5,
    volatility: "Med-High",
    maxWin: 200,
    wildMult: 1,
    accent: "#f59e0b",
    bgGradient: "from-amber-950/80 via-stone-900 to-yellow-950/40",
    symbols: [
      {
        id: "pharaoh",
        label: "Pharaoh",
        weight: 6,
        accent: "#facc15",
        pay3: 2.42,
        pay4: 8.6,
        pay5: 38.5,
      },
      {
        id: "scarab_wild",
        label: "Scarab Wild",
        weight: 8,
        isWild: true,
        accent: "#2dd4bf",
        pay3: 3.85,
        pay4: 13.0,
        pay5: 61.0,
      },
      {
        id: "ankh",
        label: "Golden Ankh",
        weight: 11,
        accent: "#fbbf24",
        pay3: 1.3,
        pay4: 4.55,
        pay5: 20.2,
      },
      {
        id: "eye_horus",
        label: "Eye of Horus",
        weight: 15,
        accent: "#38bdf8",
        pay3: 0.81,
        pay4: 2.52,
        pay5: 11.0,
      },
      {
        id: "pyramid",
        label: "Pyramid",
        weight: 19,
        accent: "#f59e0b",
        pay3: 0.5,
        pay4: 1.51,
        pay5: 6.2,
      },
      {
        id: "scroll",
        label: "Papyrus",
        weight: 20,
        accent: "#fde68a",
        pay3: 0.32,
        pay4: 0.91,
        pay5: 3.55,
      },
      {
        id: "coin",
        label: "Dinar Coin",
        weight: 21,
        accent: "#eab308",
        pay3: 0.26,
        pay4: 0.7,
        pay5: 2.65,
      },
    ],
  },
  {
    id: "neon_cyberspin",
    name: "Neon CyberSpin",
    subtitle: "5x3 Synth Grid · 10 Paylines + 2x Holo Wilds",
    rows: 3,
    cols: 5,
    mode: "lines",
    rtp: 96.4,
    houseEdge: 3.6,
    volatility: "Medium",
    maxWin: 280,
    wildMult: 2,
    accent: "#22d3ee",
    bgGradient: "from-cyan-950/75 via-slate-950 to-fuchsia-950/50",
    symbols: [
      {
        id: "cyber_core",
        label: "Quantum Core",
        weight: 6,
        accent: "#22d3ee",
        pay3: 1.59,
        pay4: 5.2,
        pay5: 23.4,
      },
      {
        id: "katana",
        label: "Plasma Blade",
        weight: 9,
        accent: "#f472b6",
        pay3: 1.04,
        pay4: 3.15,
        pay5: 13.2,
      },
      {
        id: "synth_helm",
        label: "Cyber Visor",
        weight: 13,
        accent: "#a78bfa",
        pay3: 0.71,
        pay4: 1.98,
        pay5: 7.9,
      },
      {
        id: "holo_chip",
        label: "2x Wild Chip",
        weight: 7,
        isWild: true,
        accent: "#4ade80",
        pay3: 2.34,
        pay4: 7.5,
        pay5: 33.5,
      },
      {
        id: "visor",
        label: "Holo Deck",
        weight: 20,
        accent: "#38bdf8",
        pay3: 0.35,
        pay4: 1.04,
        pay5: 3.96,
      },
      {
        id: "neon_card",
        label: "Keycard",
        weight: 22,
        accent: "#e879f9",
        pay3: 0.22,
        pay4: 0.59,
        pay5: 2.34,
      },
      {
        id: "battery",
        label: "Power Cell",
        weight: 23,
        accent: "#34d399",
        pay3: 0.17,
        pay4: 0.46,
        pay5: 1.68,
      },
    ],
  },
  {
    id: "emerald_fortune",
    name: "Emerald Fortune",
    subtitle: "5x3 Clover Reels · 10 Paylines + Gold Pot Scatters",
    rows: 3,
    cols: 5,
    mode: "lines",
    rtp: 96.5,
    houseEdge: 3.5,
    volatility: "Low-Med",
    maxWin: 140,
    accent: "#22c55e",
    bgGradient: "from-emerald-950/80 via-slate-900 to-green-950/40",
    symbols: [
      {
        id: "gold_pot",
        label: "Pot Scatter",
        weight: 10,
        isScatter: true,
        accent: "#facc15",
        scatter3: 1.81,
        scatter4: 6.65,
        scatter5: 25.3,
      },
      {
        id: "clover",
        label: "Four-Leaf Clover",
        weight: 10,
        accent: "#22c55e",
        pay3: 1.11,
        pay4: 3.78,
        pay5: 16.9,
      },
      {
        id: "horseshoe",
        label: "Gold Horseshoe",
        weight: 13,
        accent: "#fbbf24",
        pay3: 0.7,
        pay4: 2.18,
        pay5: 9.0,
      },
      {
        id: "harp",
        label: "Celtic Harp",
        weight: 16,
        accent: "#fde047",
        pay3: 0.5,
        pay4: 1.34,
        pay5: 5.15,
      },
      {
        id: "emerald",
        label: "Emerald",
        weight: 17,
        accent: "#10b981",
        pay3: 0.35,
        pay4: 0.89,
        pay5: 3.12,
      },
      {
        id: "ale",
        label: "Tavern Mug",
        weight: 17,
        accent: "#f59e0b",
        pay3: 0.25,
        pay4: 0.6,
        pay5: 2.18,
      },
      {
        id: "pipe",
        label: "Lucky Hat",
        weight: 17,
        accent: "#4ade80",
        pay3: 0.21,
        pay4: 0.45,
        pay5: 1.58,
      },
    ],
  },
  {
    id: "sugar_bonanza",
    name: "Sugar Bonanza",
    subtitle: "5x4 Candy Cascade · Pay Anywhere (6+ Symbols)",
    rows: 4,
    cols: 5,
    mode: "scatter_cluster",
    rtp: 96.4,
    houseEdge: 3.6,
    volatility: "High",
    maxWin: 300,
    accent: "#ec4899",
    bgGradient: "from-pink-950/75 via-slate-900 to-purple-950/50",
    symbols: [
      {
        id: "star_candy",
        label: "Star Candy",
        weight: 6,
        accent: "#facc15",
        any6: 9.0,
        any8: 28.0,
        any10: 90.0,
      },
      {
        id: "lollipop",
        label: "Swirl Pop",
        weight: 9,
        accent: "#ec4899",
        any6: 5.2,
        any8: 16.0,
        any10: 48.0,
      },
      {
        id: "cupcake",
        label: "Frost Cupcake",
        weight: 12,
        accent: "#a855f7",
        any6: 3.2,
        any8: 9.0,
        any10: 26.0,
      },
      {
        id: "gummy_bear",
        label: "Gummy Bear",
        weight: 16,
        accent: "#38bdf8",
        any6: 2.0,
        any8: 5.2,
        any10: 15.0,
      },
      {
        id: "strawberry",
        label: "Berry Drop",
        weight: 18,
        accent: "#f43f5e",
        any6: 1.28,
        any8: 3.15,
        any10: 9.0,
      },
      {
        id: "grape",
        label: "Grape Gem",
        weight: 19,
        accent: "#c084fc",
        any6: 0.95,
        any8: 2.3,
        any10: 6.4,
      },
      {
        id: "lemon",
        label: "Citrus Tart",
        weight: 20,
        accent: "#fde047",
        any6: 0.84,
        any8: 1.98,
        any10: 5.6,
      },
    ],
  },
];

export const SLOT_BY_ID: Record<SlotId, SlotMachineDef> = Object.fromEntries(
  SLOT_MACHINES.map((m) => [m.id, m]),
) as Record<SlotId, SlotMachineDef>;

function pickSymbol(symbols: SlotSymbolDef[], totalWeight: number, r: number): SlotSymbolDef {
  let acc = 0;
  const x = r * totalWeight;
  for (const sym of symbols) {
    acc += sym.weight;
    if (x < acc) return sym;
  }
  return symbols[symbols.length - 1]!;
}

export function spinSlot(slotId: SlotId, bet: number, rnd: () => number): SlotSpinResult {
  const def = SLOT_BY_ID[slotId];
  if (!def) throw new Error(`Unknown slot machine: ${slotId}`);
  const totalWeight = def.symbols.reduce((sum, s) => sum + s.weight, 0);
  const byId = Object.fromEntries(def.symbols.map((s) => [s.id, s])) as Record<
    string,
    SlotSymbolDef
  >;

  const grid: string[][] = Array.from({ length: def.rows }, () =>
    Array.from({ length: def.cols }, () => pickSymbol(def.symbols, totalWeight, rnd()).id),
  );

  const winLines: SlotWinLine[] = [];
  let totalMult = 0;
  let scatterCount = 0;
  let scatterMult = 0;

  if (def.mode === "scatter_cluster") {
    const counts: Record<string, number> = {};
    const cellsById: Record<string, [number, number][]> = {};
    for (let r = 0; r < def.rows; r++) {
      for (let c = 0; c < def.cols; c++) {
        const id = grid[r]![c]!;
        counts[id] = (counts[id] ?? 0) + 1;
        (cellsById[id] ??= []).push([r, c]);
      }
    }
    let idx = 0;
    for (const sym of def.symbols) {
      const cnt = counts[sym.id] ?? 0;
      let m = 0;
      if (cnt >= 10 && sym.any10) m = sym.any10;
      else if (cnt >= 8 && sym.any8) m = sym.any8;
      else if (cnt >= 6 && sym.any6) m = sym.any6;
      if (m > 0) {
        totalMult += m;
        winLines.push({
          lineIndex: idx++,
          symbolId: sym.id,
          count: cnt,
          payoutMult: m,
          cells: cellsById[sym.id]!,
        });
      }
    }
  } else if (def.cols === 3) {
    // 3x3 classic stepper
    for (let li = 0; li < LINES_3X3.length; li++) {
      const line = LINES_3X3[li]!;
      const ids = line.map(([r, c]) => grid[r]![c]!);
      if (ids[0] === ids[1] && ids[1] === ids[2]) {
        const sym = byId[ids[0]!]!;
        const m = sym.pay3 ?? 0;
        if (m > 0) {
          totalMult += m;
          winLines.push({
            lineIndex: li,
            symbolId: sym.id,
            count: 3,
            payoutMult: m,
            cells: line,
          });
        }
      } else if (ids[0] === "cherry" && ids[1] === "cherry") {
        const sym = byId["cherry"]!;
        const m = sym.pay2 ?? 0;
        if (m > 0) {
          totalMult += m;
          winLines.push({
            lineIndex: li,
            symbolId: sym.id,
            count: 2,
            payoutMult: m,
            cells: [line[0]!, line[1]!],
          });
        }
      }
    }
  } else {
    // 5x3 video slot with 10 paylines + optional wild/scatter
    const scatterSym = def.symbols.find((s) => s.isScatter);
    const wildSym = def.symbols.find((s) => s.isWild);
    if (scatterSym) {
      for (let r = 0; r < def.rows; r++) {
        for (let c = 0; c < def.cols; c++) {
          if (grid[r]![c] === scatterSym.id) scatterCount++;
        }
      }
      if (scatterCount >= 5) scatterMult = scatterSym.scatter5 ?? 0;
      else if (scatterCount === 4) scatterMult = scatterSym.scatter4 ?? 0;
      else if (scatterCount === 3) scatterMult = scatterSym.scatter3 ?? 0;
      totalMult += scatterMult;
    }
    for (let li = 0; li < LINES_5X3.length; li++) {
      const line = LINES_5X3[li]!;
      const ids = line.map(([r, c]) => grid[r]![c]!);
      let targetId = ids[0]!;
      if (wildSym) {
        const firstNonWild = ids.find((id) => id !== wildSym.id && id !== scatterSym?.id);
        targetId = firstNonWild ?? wildSym.id;
      }
      if (scatterSym && targetId === scatterSym.id) continue;
      let count = 0;
      let lineHasWild = false;
      for (const id of ids) {
        if (id === targetId || (wildSym && id === wildSym.id)) {
          count++;
          if (wildSym && id === wildSym.id) lineHasWild = true;
        } else {
          break;
        }
      }
      if (count >= 3) {
        const sym = byId[targetId]!;
        let m = count === 5 ? (sym.pay5 ?? 0) : count === 4 ? (sym.pay4 ?? 0) : (sym.pay3 ?? 0);
        if (m > 0 && lineHasWild && def.wildMult && def.wildMult > 1 && targetId !== wildSym?.id) {
          m *= def.wildMult;
        }
        if (m > 0) {
          totalMult += m;
          winLines.push({
            lineIndex: li,
            symbolId: targetId,
            count,
            payoutMult: Math.round(m * 100) / 100,
            cells: line.slice(0, count),
          });
        }
      }
    }
  }

  totalMult = Math.round(totalMult * 100) / 100;
  const payout = Math.round(bet * totalMult * 100) / 100;
  let bonusLabel: string | undefined;
  if (totalMult >= 25) bonusLabel = "Mega Win";
  else if (totalMult >= 10) bonusLabel = "Big Win";
  else if (scatterMult > 0) bonusLabel = `${scatterCount}× Scatter Hit`;

  return {
    slotId,
    grid,
    totalMult,
    payout,
    winLines,
    scatterCount,
    scatterMult,
    bonusLabel,
  };
}
