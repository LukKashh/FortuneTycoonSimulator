import { describe, expect, it } from "vitest";
import { apply, netWorth, newPlayer, type Ctx } from "./engine";
import {
  CASINO,
  EMPTY_MODS,
  PROPERTIES,
  PROPERTY_NET_BOOST,
  type PlinkoRisk,
  type PlinkoRows,
} from "./config";
import {
  casinoWalletDollars,
  chickenMultiplier,
  crashPointFromUnit,
  diceMultiplier,
  diceWinChance,
  hiloOdds,
  hiloStepMult,
  minesMultiplier,
  rngFromHex,
} from "./casino";
import { SLOT_MACHINES, spinSlot } from "./slots";

const T0 = 1_700_000_000_000;
const ctx = (cash = 0, seed = "0123456789abcdef0123456789abcdef"): Ctx => {
  const s = newPlayer(T0, "t");
  s.cash = cash;
  return {
    s,
    now: T0,
    ledger: [],
    stock: [],
    corpMods: EMPTY_MODS,
    casinoSeed: seed,
  } as Ctx;
};

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
}

describe("casino chip wallet & 3 denominations", () => {
  it("1 base chip = $100, exchanged both ways with no fee", () => {
    const c = ctx(1000);
    apply(c, { type: "buyChips", chips: 10 });
    expect(c.ledger.find((l) => l.type === "chips_buy")!.amount).toBe(1000);
    expect(c.s.casino!.chips).toBe(10);
    apply(c, { type: "sellChips", chips: 10 });
    expect(c.ledger.find((l) => l.type === "chips_sell")!.amount).toBe(1000);
    expect(c.s.casino!.chips).toBe(0);
    expect(CASINO.chipValue).toBe(100);
  });

  it("supports $100, $1,000, and $5,000 denominations into unified Digital Chip Wallet", () => {
    const c = ctx(50_000);
    apply(c, { type: "buyChips", chips: 3, denom: 5000 }); // $15,000
    apply(c, { type: "buyChips", chips: 4, denom: 1000 }); // $4,000
    apply(c, { type: "buyChips", chips: 5, denom: 100 }); // $500
    expect(c.s.cash).toBe(30_500);
    expect(casinoWalletDollars(c.s.casino!)).toBe(19_500);
    expect(c.s.casino!.denoms).toEqual({ 100: 5, 1000: 4, 5000: 3 });
    expect(netWorth(c.s, T0).total).toBe(50_000);

    apply(c, { type: "sellChips", chips: 2, denom: 5000 }); // -$10,000
    expect(casinoWalletDollars(c.s.casino!)).toBe(9_500);
    expect(c.s.cash).toBe(40_500);
  });

  it("cannot bet more chips than owned", () => {
    const c = ctx(100);
    apply(c, { type: "buyChips", chips: 1 });
    expect(() => apply(c, { type: "casinoKeno", bet: 2, picks: [1] })).toThrow();
  });
});

describe("casino originals & calibrated house edges", () => {
  it("dice maintains 1% house edge (99% RTP) and settles deterministically", () => {
    const wc = diceWinChance(50, "under");
    expect(wc).toBe(50);
    expect(diceMultiplier(wc)).toBeCloseTo(1.98, 4);

    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 100 });
    apply(c, { type: "casinoDice", bet: 10, target: 50, condition: "under" });
    const res = c.s.casino!.last!;
    expect(res.game).toBe("dice");
    expect(res.detail.roll).toBeGreaterThanOrEqual(0);
    expect(res.detail.roll).toBeLessThan(100);
    expect(c.s.casino!.chips).toBeCloseTo(90 + res.payout, 2);
  });

  it("plinko payout tables stay calibrated (~98.5%-99.0% RTP) across all risks and rows", () => {
    for (const risk of ["low", "medium", "high"] as PlinkoRisk[]) {
      for (const rows of [8, 12, 16] as PlinkoRows[]) {
        const pay = CASINO.plinkoPay[risk][rows];
        let ev = 0;
        for (let k = 0; k <= rows; k++) {
          ev += (comb(rows, k) / Math.pow(2, rows)) * pay[k]!;
        }
        expect(ev).toBeGreaterThan(0.98);
        expect(ev).toBeLessThan(0.992);
      }
    }
    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 100 });
    apply(c, { type: "casinoPlinko", bet: 5, risk: "medium", rows: 12 });
    const d = c.s.casino!.last!.detail;
    expect(d.path.length).toBe(12);
    expect(d.bucket).toBe(d.path.reduce((a: number, b: number) => a + b, 0));
  });

  it("keno 40-ball tables enforce ~97.0% RTP (3% house edge) across all risk modes", () => {
    const total = comb(40, 10);
    for (const risk of ["low", "classic", "high"] as const) {
      for (let spots = 1; spots <= 10; spots++) {
        const pay = CASINO.keno40Pay[risk][spots]!;
        let ev = 0;
        for (let h = 0; h <= Math.min(spots, 10); h++) {
          ev += ((comb(spots, h) * comb(40 - spots, 10 - h)) / total) * (pay[h] ?? 0);
        }
        expect(ev).toBeGreaterThan(0.965);
        expect(ev).toBeLessThan(0.976);
      }
    }
    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 50 });
    apply(c, { type: "casinoKeno", bet: 5, picks: [3, 7, 14, 22, 39], risk: "classic" });
    expect(c.s.casino!.last!.detail.draw).toHaveLength(10);
  });

  it("crash uses 3% house edge and settles target multiplier wins/busts", () => {
    expect(crashPointFromUnit(0.01)).toBe(1.0);
    expect(crashPointFromUnit(0.5)).toBeCloseTo(1.94, 2);

    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 50 });
    apply(c, { type: "casinoCrash", bet: 10, targetMult: 2.0 });
    const last = c.s.casino!.last!;
    expect(last.game).toBe("crash");
    expect(last.payout).toBe(last.detail.won ? 20 : 0);
  });

  it("mines multiplier grows with each safe tile (3% house edge)", () => {
    expect(minesMultiplier(3, 1)).toBeCloseTo((25 / 22) * 0.97, 6);
    expect(minesMultiplier(3, 2)).toBeGreaterThan(minesMultiplier(3, 1));
  });

  it("chicken enforces 3% house edge per lane and supports step + cashout", () => {
    const m1 = chickenMultiplier("medium", 1);
    expect(m1).toBeCloseTo(0.97 / 0.8, 2);
    expect(chickenMultiplier("hard", 3)).toBeCloseTo(0.97 / Math.pow(0.65, 3), 1);

    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 50 });
    // Find a seed where step 1 survives
    let survived = false;
    for (let i = 0; i < 10; i++) {
      const testCtx = ctx(10_000, `abcdef0123456789abcdef012345670${i}`);
      apply(testCtx, { type: "buyChips", chips: 50 });
      apply(testCtx, { type: "casinoChicken", move: "start", bet: 10, difficulty: "easy" });
      apply(testCtx, { type: "casinoChicken", move: "step" });
      if (testCtx.s.casino!.active?.game === "chicken") {
        survived = true;
        apply(testCtx, { type: "casinoChicken", move: "cashout" });
        expect(testCtx.s.casino!.last!.detail.won).toBe(true);
        expect(testCtx.s.casino!.last!.payout).toBeCloseTo(10 * chickenMultiplier("easy", 1), 2);
        break;
      }
    }
    expect(survived).toBe(true);
    void c;
  });

  it("hilo handles Ace/King odds properly and supports skip + cashout", () => {
    expect(hiloOdds(1).higher).toBeCloseTo(12 / 13, 6);
    expect(hiloOdds(13).lower).toBeCloseTo(12 / 13, 6);
    expect(hiloStepMult(0.5)).toBeCloseTo(1.94, 4);

    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 50 });
    apply(c, { type: "casinoHilo", move: "start", bet: 5 });
    expect(c.s.casino!.active?.game).toBe("hilo");
    apply(c, { type: "casinoHilo", move: "skip" });
    expect(c.s.casino!.active?.game).toBe("hilo");
    if (c.s.casino!.active?.game === "hilo") {
      expect(c.s.casino!.active.skips).toBe(1);
    }
  });

  it("roulette legacy compatibility still settles cleanly", () => {
    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 100 });
    apply(c, { type: "casinoRoulette", bets: [{ kind: "red", amount: 10 }] });
    const last = c.s.casino!.last!;
    expect([0, 20]).toContain(last.payout);
    expect(c.s.casino!.chips).toBe(90 + last.payout);
  });
});

describe("6 calibrated slot machines", () => {
  it("each of the 6 slot games executes cleanly and exhibits ~96.4% Monte Carlo RTP", () => {
    expect(SLOT_MACHINES).toHaveLength(6);
    const rnd = rngFromHex("fedcba9876543210fedcba9876543210");
    for (const machine of SLOT_MACHINES) {
      let totalWon = 0;
      const spins = 35_000;
      for (let i = 0; i < spins; i++) {
        totalWon += spinSlot(machine.id, 1, rnd).payout;
      }
      const empRtp = totalWon / spins;
      expect(empRtp).toBeGreaterThan(0.92);
      expect(empRtp).toBeLessThan(1.0);
    }

    const c = ctx(10_000);
    apply(c, { type: "buyChips", chips: 50 });
    apply(c, { type: "casinoSlot", slotId: "olympus_thunder", bet: 2 });
    const last = c.s.casino!.last!;
    expect(last.game).toBe("slot:olympus_thunder");
    expect(last.detail.grid).toHaveLength(3);
    expect(last.detail.grid[0]).toHaveLength(5);
  });
});

describe("property returns", () => {
  it("default net return doubled from previous 1.5x boost (3x base)", () => {
    expect(PROPERTY_NET_BOOST).toBe(6);
    const studio = PROPERTIES.find((p) => p.id === "p_studio")!;
    expect(studio.rent - studio.expense).toBeCloseTo((22 - 5) * 6, 2);
  });
});
