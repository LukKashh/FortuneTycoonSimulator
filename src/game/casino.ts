/* eslint-disable @typescript-eslint/no-explicit-any */
// Casino: pure, server-authoritative game logic played with Digital Chip Wallet balance.
// Hidden outcomes (rolls, peg paths, crash points, mine positions, traffic hazards, cards, slot reels)
// come from a per-round HMAC seed so nothing secret sits in the player's save while a round is open.
import {
  CASINO,
  type CasinoDenomination,
  type ChickenDifficulty,
  type KenoRisk,
  type PlinkoRisk,
  type PlinkoRows,
} from "./config";
import { spinSlot, SLOT_BY_ID, type SlotId } from "./slots";
import { GameError, type PlayerState } from "./types";

export type Card = { r: number; s: number }; // r 1..13 (A..K), s 0..3

export type ChipDenomCounts = {
  100: number;
  1000: number;
  5000: number;
};

export type CasinoActive =
  | {
      game: "blackjack";
      round: number;
      bet: number;
      player: Card[];
      dealer: Card[];
      drawn: number;
      doubled: boolean;
    }
  | { game: "mines"; round: number; bet: number; mines: number; revealed: number[] }
  | {
      game: "hilo";
      round: number;
      bet: number;
      card: Card;
      drawn: number;
      skips: number;
      mult: number;
      history: Card[];
    }
  | {
      game: "chicken";
      round: number;
      bet: number;
      difficulty: ChickenDifficulty;
      step: number;
      maxSteps: number;
      mult: number;
    };

export type CasinoResult = {
  game: string;
  bet: number;
  payout: number;
  at: number;
  detail: Record<string, any>;
};

export type CasinoState = {
  chips: number; // unified Digital Chip Wallet balance in $100 base units (walletDollars = chips * 100)
  denoms?: ChipDenomCounts;
  round: number;
  active: CasinoActive | null;
  last: CasinoResult | null;
  stats: { wagered: number; won: number; rounds: number; biggestWin: number };
};

export type RouletteBet = {
  kind: "red" | "black" | "even" | "odd" | "low" | "high" | "dozen" | "column" | "straight";
  value?: number;
  amount: number;
};

export type CasinoAction =
  | { type: "casinoDice"; bet: number; target: number; condition: "over" | "under" }
  | { type: "casinoPlinko"; bet: number; risk: PlinkoRisk; rows: PlinkoRows }
  | { type: "casinoKeno"; bet: number; picks: number[]; risk?: KenoRisk }
  | { type: "casinoCrash"; bet: number; targetMult: number }
  | {
      type: "casinoMines";
      move: "start" | "reveal" | "cashout";
      bet?: number;
      mines?: number;
      tile?: number;
    }
  | {
      type: "casinoChicken";
      move: "start" | "step" | "cashout";
      bet?: number;
      difficulty?: ChickenDifficulty;
    }
  | {
      type: "casinoHilo";
      move: "start" | "higher" | "lower" | "skip" | "cashout";
      bet?: number;
    }
  | { type: "casinoSlot"; slotId: SlotId; bet: number }
  | { type: "casinoRoulette"; bets: RouletteBet[] }
  | { type: "casinoBlackjack"; move: "start" | "hit" | "stand" | "double"; bet?: number };

export const CASINO_TYPES = new Set([
  "casinoDice",
  "casinoPlinko",
  "casinoKeno",
  "casinoCrash",
  "casinoMines",
  "casinoChicken",
  "casinoHilo",
  "casinoSlot",
  "casinoRoulette",
  "casinoBlackjack",
]);

export function casinoWalletDollars(cs: Pick<CasinoState, "chips">): number {
  return Math.round((cs.chips || 0) * CASINO.chipValue * 100) / 100;
}

export function chipBreakdown(dollars: number): ChipDenomCounts & { loose: number } {
  const safe = Math.max(0, Math.round(dollars * 100) / 100);
  const c5000 = Math.floor(safe / 5000);
  const rem1 = safe - c5000 * 5000;
  const c1000 = Math.floor(rem1 / 1000);
  const rem2 = rem1 - c1000 * 1000;
  const c100 = Math.floor(rem2 / 100);
  const loose = Math.round((rem2 - c100 * 100) * 100) / 100;
  return { 5000: c5000, 1000: c1000, 100: c100, loose };
}

export function denomsTotalDollars(d?: Partial<ChipDenomCounts>): number {
  if (!d) return 0;
  return (d[5000] ?? 0) * 5000 + (d[1000] ?? 0) * 1000 + (d[100] ?? 0) * 100;
}

export function syncDenoms(cs: CasinoState) {
  const bd = chipBreakdown(casinoWalletDollars(cs));
  cs.denoms = { 100: bd[100], 1000: bd[1000], 5000: bd[5000] };
}

export function addDenomChips(cs: CasinoState, denom: CasinoDenomination, count: number) {
  const d = (cs.denoms ??= { 100: 0, 1000: 0, 5000: 0 });
  d[denom] = (d[denom] ?? 0) + count;
}

export function removeDenomChips(cs: CasinoState, denom: CasinoDenomination, count: number) {
  if (cs.denoms && (cs.denoms[denom] ?? 0) >= count) {
    cs.denoms[denom] -= count;
    const expected = casinoWalletDollars(cs);
    if (Math.abs(denomsTotalDollars(cs.denoms) - expected) < 0.01) return;
  }
  syncDenoms(cs);
}

export function casinoOf(s: PlayerState): CasinoState {
  if (!s.casino) {
    s.casino = {
      chips: 0,
      denoms: { 100: 0, 1000: 0, 5000: 0 },
      round: 0,
      active: null,
      last: null,
      stats: { wagered: 0, won: 0, rounds: 0, biggestWin: 0 },
    };
  }
  if (!s.casino.denoms) syncDenoms(s.casino);
  return s.casino;
}

// ---- seeded rng (sfc32 from a 128-bit hex seed)
export function rngFromHex(hex: string) {
  const w = [0, 1, 2, 3].map((i) => parseInt(hex.slice(i * 8, i * 8 + 8) || "9e3779b9", 16) >>> 0);
  let [a, b, c, d] = w as [number, number, number, number];
  const next = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}

function shuffled<T>(arr: T[], rnd: () => number) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const deck = (rnd: () => number) =>
  shuffled(
    Array.from({ length: 52 }, (_, i) => ({ r: (i % 13) + 1, s: Math.floor(i / 13) })),
    rnd,
  );

const c2 = (v: number) => Math.round(v * 100) / 100;

// ---- shared math & multipliers
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function handValue(cards: Card[]) {
  let t = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.r === 1) {
      aces++;
      t += 11;
    } else t += Math.min(10, c.r);
  }
  while (t > 21 && aces) {
    t -= 10;
    aces--;
  }
  return { total: t, soft: aces > 0 };
}

export function diceWinChance(target: number, condition: "over" | "under"): number {
  const clamped = Math.max(2, Math.min(98, Math.round(target * 100) / 100));
  return Math.round((condition === "under" ? clamped : 100 - clamped) * 100) / 100;
}

export function diceMultiplier(winChance: number): number {
  const wc = Math.max(2, Math.min(98, winChance));
  return Math.round((((1 - CASINO.diceHouseEdge) * 100) / wc) * 10000) / 10000;
}

export function plinkoMultiplier(risk: PlinkoRisk, rows: PlinkoRows, bucket: number): number {
  return CASINO.plinkoPay[risk]?.[rows]?.[bucket] ?? 0;
}

export function kenoMultiplier(spots: number, hits: number, risk: KenoRisk = "classic"): number {
  return CASINO.keno40Pay[risk]?.[spots]?.[hits] ?? 0;
}

export function crashPointFromUnit(u: number): number {
  if (u < CASINO.crashHouseEdge) return 1.0;
  const raw = (1 - CASINO.crashHouseEdge) / (1 - u);
  return Math.min(CASINO.crashMaxMult, Math.max(1.01, Math.floor(raw * 100) / 100));
}

export function minesMultiplier(mines: number, safe: number) {
  let m = 1;
  for (let i = 0; i < safe; i++) m *= (25 - i) / (25 - mines - i);
  return safe === 0 ? 1 : m * (1 - CASINO.houseEdge);
}

export function chickenMultiplier(difficulty: ChickenDifficulty, step: number): number {
  if (step <= 0) return 1;
  const p = CASINO.chickenModes[difficulty].survivalProb;
  return Math.round(((1 - CASINO.chickenHouseEdge) / Math.pow(p, step)) * 100) / 100;
}

export function hiloOdds(r: number) {
  if (r === 1) return { higher: 12 / 13, lower: 1 / 13 };
  if (r === 13) return { higher: 1 / 13, lower: 12 / 13 };
  return { higher: (14 - r) / 13, lower: r / 13 };
}

export const hiloStepMult = (p: number) => (1 - CASINO.houseEdge) / p;

function stake(cs: CasinoState, bet: number) {
  if (!Number.isFinite(bet) || bet < CASINO.minBet)
    throw new GameError(`Minimum bet is $${(CASINO.minBet * CASINO.chipValue).toLocaleString()}`);
  if (bet > CASINO.maxBet)
    throw new GameError(`Maximum bet is $${(CASINO.maxBet * CASINO.chipValue).toLocaleString()}`);
  const b = c2(bet);
  if (cs.chips + 1e-9 < b) throw new GameError("Not enough chips in wallet");
  cs.chips = c2(cs.chips - b);
  cs.stats.wagered = c2(cs.stats.wagered + b);
  syncDenoms(cs);
  return b;
}

function settle(
  cs: CasinoState,
  now: number,
  game: string,
  bet: number,
  payout: number,
  detail: Record<string, any>,
) {
  const p = c2(Math.max(0, payout));
  cs.chips = c2(cs.chips + p);
  cs.stats.won = c2(cs.stats.won + p);
  cs.stats.rounds += 1;
  if (p - bet > cs.stats.biggestWin) cs.stats.biggestWin = c2(p - bet);
  cs.last = { game, bet, payout: p, at: now, detail };
  cs.active = null;
  cs.round += 1;
  syncDenoms(cs);
}

/** `seedHex` is the secret per-round seed for `casino.round`. */
export function applyCasino(s: PlayerState, a: CasinoAction, seedHex: string, now: number) {
  const cs = casinoOf(s);
  const rnd = rngFromHex(seedHex);
  const busy = (g: string) => {
    if (cs.active && cs.active.game !== g) throw new GameError("Finish your current game first");
  };

  switch (a.type) {
    case "casinoDice": {
      if (cs.active) throw new GameError("Finish your current game first");
      const cond = a.condition === "over" ? "over" : "under";
      const target = Math.round(Number(a.target) * 100) / 100;
      if (!Number.isFinite(target) || target < 2 || target > 98) {
        throw new GameError("Target must be between 2.00 and 98.00");
      }
      const winChance = diceWinChance(target, cond);
      const mult = diceMultiplier(winChance);
      const bet = stake(cs, a.bet);
      const roll = Math.floor(rnd() * 10000) / 100; // 0.00 .. 99.99 (10,000 outcomes)
      const won = cond === "under" ? roll < target : roll >= target;
      const payout = won ? bet * mult : 0;
      settle(cs, now, "dice", bet, payout, { roll, target, condition: cond, winChance, mult, won });
      break;
    }

    case "casinoPlinko": {
      if (cs.active) throw new GameError("Finish your current game first");
      const risk: PlinkoRisk = a.risk === "low" || a.risk === "high" ? a.risk : "medium";
      const rows: PlinkoRows = a.rows === 8 || a.rows === 16 ? a.rows : 12;
      const bet = stake(cs, a.bet);
      const path: number[] = [];
      let bucket = 0;
      for (let i = 0; i < rows; i++) {
        const dir = rnd() < 0.5 ? 0 : 1;
        path.push(dir);
        bucket += dir;
      }
      const mult = plinkoMultiplier(risk, rows, bucket);
      const payout = bet * mult;
      settle(cs, now, "plinko", bet, payout, { risk, rows, path, bucket, mult });
      break;
    }

    case "casinoKeno": {
      if (cs.active) throw new GameError("Finish your current game first");
      const risk: KenoRisk = a.risk === "low" || a.risk === "high" ? a.risk : "classic";
      const picks = [...new Set(a.picks)].filter((x) => Number.isInteger(x) && x >= 1 && x <= 40);
      if (picks.length < 1 || picks.length > 10 || picks.length !== a.picks.length)
        throw new GameError("Pick 1 to 10 numbers (1–40)");
      const bet = stake(cs, a.bet);
      const draw = shuffled(
        Array.from({ length: 40 }, (_, i) => i + 1),
        rnd,
      ).slice(0, 10);
      const hits = picks.filter((x) => draw.includes(x)).length;
      const mult = kenoMultiplier(picks.length, hits, risk);
      settle(cs, now, "keno", bet, bet * mult, { draw, picks, hits, mult, risk });
      break;
    }

    case "casinoCrash": {
      if (cs.active) throw new GameError("Finish your current game first");
      const targetMult = Math.round(Number(a.targetMult) * 100) / 100;
      if (!Number.isFinite(targetMult) || targetMult < 1.01 || targetMult > CASINO.crashMaxMult) {
        throw new GameError(`Target cashout must be between 1.01× and ${CASINO.crashMaxMult}×`);
      }
      const bet = stake(cs, a.bet);
      const crashPoint = crashPointFromUnit(rnd());
      const won = crashPoint >= targetMult;
      const payout = won ? bet * targetMult : 0;
      settle(cs, now, "crash", bet, payout, { crashPoint, targetMult, won });
      break;
    }

    case "casinoMines": {
      busy("mines");
      if (a.move === "start") {
        if (cs.active) throw new GameError("Game already in progress");
        const mines = Math.floor(a.mines ?? 3);
        if (mines < 1 || mines > 24) throw new GameError("Choose 1 to 24 mines");
        const bet = stake(cs, a.bet ?? 0);
        cs.active = { game: "mines", round: cs.round, bet, mines, revealed: [] };
        break;
      }
      const st = cs.active;
      if (!st || st.game !== "mines") throw new GameError("No game in progress");
      const field = shuffled(
        Array.from({ length: 25 }, (_, i) => i),
        rnd,
      ).slice(0, st.mines);
      if (a.move === "cashout") {
        if (!st.revealed.length) throw new GameError("Reveal at least one tile first");
        settle(cs, now, "mines", st.bet, st.bet * minesMultiplier(st.mines, st.revealed.length), {
          mines: field,
          revealed: st.revealed,
          boom: false,
        });
        break;
      }
      const t = Math.floor(a.tile ?? -1);
      if (t < 0 || t > 24 || st.revealed.includes(t)) throw new GameError("Invalid tile");
      if (field.includes(t)) {
        settle(cs, now, "mines", st.bet, 0, {
          mines: field,
          revealed: st.revealed,
          boom: true,
          hit: t,
        });
        break;
      }
      st.revealed.push(t);
      if (st.revealed.length === 25 - st.mines)
        settle(cs, now, "mines", st.bet, st.bet * minesMultiplier(st.mines, st.revealed.length), {
          mines: field,
          revealed: st.revealed,
          boom: false,
        });
      break;
    }

    case "casinoChicken": {
      busy("chicken");
      if (a.move === "start") {
        if (cs.active) throw new GameError("Game already in progress");
        const diff: ChickenDifficulty =
          a.difficulty && a.difficulty in CASINO.chickenModes ? a.difficulty : "easy";
        const bet = stake(cs, a.bet ?? 0);
        cs.active = {
          game: "chicken",
          round: cs.round,
          bet,
          difficulty: diff,
          step: 0,
          maxSteps: CASINO.chickenMaxSteps,
          mult: 1,
        };
        break;
      }
      const st = cs.active;
      if (!st || st.game !== "chicken") throw new GameError("No Chicken round in progress");
      if (a.move === "cashout") {
        if (st.step < 1) throw new GameError("Cross at least one lane first");
        settle(cs, now, "chicken", st.bet, st.bet * st.mult, {
          difficulty: st.difficulty,
          step: st.step,
          mult: st.mult,
          won: true,
        });
        break;
      }
      // step forward onto st.step + 1
      const nextStep = st.step + 1;
      const p = CASINO.chickenModes[st.difficulty].survivalProb;
      let laneRoll = 0;
      for (let i = 0; i < nextStep; i++) laneRoll = rnd();
      if (laneRoll >= p) {
        settle(cs, now, "chicken", st.bet, 0, {
          difficulty: st.difficulty,
          step: st.step,
          hitLane: nextStep,
          mult: 0,
          won: false,
        });
        break;
      }
      st.step = nextStep;
      st.mult = chickenMultiplier(st.difficulty, st.step);
      if (st.step >= st.maxSteps) {
        settle(cs, now, "chicken", st.bet, st.bet * st.mult, {
          difficulty: st.difficulty,
          step: st.step,
          mult: st.mult,
          won: true,
          cleared: true,
        });
      }
      break;
    }

    case "casinoHilo": {
      busy("hilo");
      const d = deck(rnd);
      const at = (i: number) => d[i % 52]!;
      if (a.move === "start") {
        if (cs.active) throw new GameError("Game already in progress");
        const bet = stake(cs, a.bet ?? 0);
        cs.active = {
          game: "hilo",
          round: cs.round,
          bet,
          card: at(0),
          drawn: 1,
          skips: 0,
          mult: 1,
          history: [at(0)],
        };
        break;
      }
      const st = cs.active;
      if (!st || st.game !== "hilo") throw new GameError("No game in progress");
      if (a.move === "cashout") {
        if (st.mult <= 1) throw new GameError("Make at least one correct guess first");
        settle(cs, now, "hilo", st.bet, st.bet * st.mult, {
          history: st.history,
          won: true,
          mult: st.mult,
        });
        break;
      }
      if (a.move === "skip") {
        if ((st.skips ?? 0) >= CASINO.hiloMaxSkips) {
          throw new GameError(`Maximum ${CASINO.hiloMaxSkips} skips per round`);
        }
        const next = at(st.drawn++);
        st.skips = (st.skips ?? 0) + 1;
        st.card = next;
        st.history.push(next);
        break;
      }
      const odds = hiloOdds(st.card.r);
      const p = a.move === "higher" ? odds.higher : odds.lower;
      const next = at(st.drawn++);
      const ok =
        a.move === "higher"
          ? st.card.r === 1
            ? next.r > 1
            : next.r >= st.card.r
          : st.card.r === 13
            ? next.r < 13
            : next.r <= st.card.r;
      st.history.push(next);
      if (!ok) {
        settle(cs, now, "hilo", st.bet, 0, { history: st.history, won: false, mult: 0 });
        break;
      }
      st.mult = Math.round(st.mult * hiloStepMult(p) * 10000) / 10000;
      st.card = next;
      if (st.mult >= CASINO.hiloMaxMult)
        settle(cs, now, "hilo", st.bet, st.bet * CASINO.hiloMaxMult, {
          history: st.history,
          won: true,
          mult: CASINO.hiloMaxMult,
        });
      break;
    }

    case "casinoSlot": {
      if (cs.active) throw new GameError("Finish your current game first");
      if (!SLOT_BY_ID[a.slotId]) throw new GameError("Unknown slot machine");
      const bet = stake(cs, a.bet);
      const res = spinSlot(a.slotId, bet, rnd);
      settle(cs, now, `slot:${a.slotId}`, bet, res.payout, { ...res });
      break;
    }

    case "casinoRoulette": {
      busy("roulette");
      if (cs.active) throw new GameError("Finish your current game first");
      if (!Array.isArray(a.bets) || !a.bets.length || a.bets.length > 40)
        throw new GameError("Place at least one bet");
      const total = a.bets.reduce((t, b) => t + (Number(b.amount) || 0), 0);
      for (const b of a.bets)
        if (!(b.amount >= CASINO.minBet)) throw new GameError("Each bet needs a valid stake");
      const bet = stake(cs, total);
      const n = Math.floor(rnd() * 37);
      let payout = 0;
      for (const b of a.bets) {
        const v = b.value ?? 0;
        const hit =
          b.kind === "straight"
            ? n === v
            : n === 0
              ? false
              : b.kind === "red"
                ? RED.has(n)
                : b.kind === "black"
                  ? !RED.has(n)
                  : b.kind === "even"
                    ? n % 2 === 0
                    : b.kind === "odd"
                      ? n % 2 === 1
                      : b.kind === "low"
                        ? n <= 18
                        : b.kind === "high"
                          ? n >= 19
                          : b.kind === "dozen"
                            ? Math.ceil(n / 12) === v
                            : b.kind === "column"
                              ? ((n - 1) % 3) + 1 === v
                              : false;
        if (b.kind === "straight" && (v < 0 || v > 36 || !Number.isInteger(v)))
          throw new GameError("Invalid number");
        if ((b.kind === "dozen" || b.kind === "column") && ![1, 2, 3].includes(v))
          throw new GameError("Invalid bet");
        const odds = b.kind === "straight" ? 35 : b.kind === "dozen" || b.kind === "column" ? 2 : 1;
        if (hit) payout += b.amount * (odds + 1);
      }
      settle(cs, now, "roulette", bet, payout, { number: n });
      break;
    }

    case "casinoBlackjack": {
      busy("blackjack");
      const d = deck(rnd);
      if (a.move === "start") {
        if (cs.active) throw new GameError("Hand already in progress");
        const bet = stake(cs, a.bet ?? 0);
        const st: Extract<CasinoActive, { game: "blackjack" }> = {
          game: "blackjack",
          round: cs.round,
          bet,
          player: [d[0]!, d[2]!],
          dealer: [d[1]!],
          drawn: 4,
          doubled: false,
        };
        cs.active = st;
        const pv = handValue(st.player).total;
        const dv = handValue([d[1]!, d[3]!]).total;
        if (pv === 21 || dv === 21) finishBj(cs, st, d, now);
        break;
      }
      const st = cs.active;
      if (!st || st.game !== "blackjack") throw new GameError("No hand in progress");
      if (a.move === "hit") {
        st.player.push(d[st.drawn++]!);
        if (handValue(st.player).total >= 21) finishBj(cs, st, d, now);
      } else if (a.move === "double") {
        if (st.player.length !== 2)
          throw new GameError("You can only double on your first two cards");
        stake(cs, st.bet);
        st.bet *= 2;
        st.doubled = true;
        st.player.push(d[st.drawn++]!);
        finishBj(cs, st, d, now);
      } else finishBj(cs, st, d, now);
      break;
    }
  }
}

function finishBj(
  cs: CasinoState,
  st: Extract<CasinoActive, { game: "blackjack" }>,
  d: Card[],
  now: number,
) {
  const hole = d[3]!;
  const dealer = [st.dealer[0]!, hole];
  const pv = handValue(st.player).total;
  const natural = st.player.length === 2 && pv === 21;
  const dNatural = handValue(dealer).total === 21;
  let i = st.drawn;
  if (pv <= 21 && !natural) {
    while (true) {
      const h = handValue(dealer);
      if (h.total >= 17) break;
      dealer.push(d[i++]!);
    }
  }
  const dv = handValue(dealer).total;
  let payout = 0;
  let outcome: string;
  if (pv > 21) outcome = "bust";
  else if (natural && !dNatural) {
    payout = st.bet * 2.5;
    outcome = "blackjack";
  } else if (dNatural && !natural) outcome = "dealer blackjack";
  else if (dv > 21 || pv > dv) {
    payout = st.bet * 2;
    outcome = "win";
  } else if (pv === dv) {
    payout = st.bet;
    outcome = "push";
  } else outcome = "lose";
  settle(cs, now, "blackjack", st.bet, payout, { player: st.player, dealer, outcome, pv, dv });
}
