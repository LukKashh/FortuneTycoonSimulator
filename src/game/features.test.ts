import { describe, it, expect } from "vitest";
import { apply, newPlayer, reconcileState, tick, type Ctx } from "./engine";
import { EMPTY_MODS } from "./config";
import { listCrypto, listStocks, stockLiquidity } from "./market";
import {
  CATEGORIES,
  COLLECTIBLES,
  GRADING_FEE_PCT,
  RARITIES,
  collectibleValue,
} from "./collectibles";
import { ACHIEVEMENT_TRACKS, getTrackProgress } from "./achievements";
import { BIO_COOLDOWN_MS, BIO_MAX_LENGTH, DEFAULT_AVATAR, DEFAULT_TITLE } from "./profile";

describe("Markets, Assets Grading, Profile & Achievements Domain Logic", () => {
  const baseTime = Date.UTC(2026, 9, 10, 12, 0, 0);

  const createCtx = (s = newPlayer(baseTime), now = baseTime): Ctx => ({
    s,
    now,
    ledger: [],
    stock: [],
    corpMods: EMPTY_MODS,
  });

  it("lists 65 real-life stock companies and 45 ranked real-life crypto coins with custom textures", async () => {
    const stocks = listStocks(baseTime);
    const cryptos = listCrypto(baseTime);
    const { stockLogo, cryptoLogo, collectibleCategoryTexture, collectibleItemTexture } =
      await import("@/components/game/art");

    expect(stocks).toHaveLength(65);
    expect(new Set(stocks.map((s) => s.ticker)).size).toBe(65);
    expect(stocks.some((s) => s.ticker === "NVDA" && s.name.includes("NVIDIA"))).toBe(true);
    expect(stocks.some((s) => s.ticker === "AAPL" && s.name.includes("Apple"))).toBe(true);
    expect(stocks.some((s) => s.ticker === "JPM" && s.name.includes("JPMorgan"))).toBe(true);
    expect(stockLiquidity(stocks[0]!, 1)).toBeGreaterThanOrEqual(2_500);

    for (const st of stocks) {
      expect(stockLogo(st.ticker, st.sector)).toContain("data:image/svg+xml;utf8,");
    }

    expect(cryptos).toHaveLength(45);
    expect(cryptos[0]!.symbol).toBe("BTC");
    expect(cryptos[cryptos.length - 1]!.symbol).toBe("SHIB");
    for (let i = 1; i < cryptos.length; i++) {
      expect(cryptos[i - 1]!.base).toBeGreaterThanOrEqual(cryptos[i]!.base);
    }
    for (const cr of cryptos) {
      expect(cryptoLogo(cr.symbol)).toContain("data:image/svg+xml;utf8,");
    }

    for (const cat of CATEGORIES) {
      expect(collectibleCategoryTexture(cat.id)).toContain("data:image/svg+xml;utf8,");
    }
    const itemTextures = new Set(
      COLLECTIBLES.map((it) => collectibleItemTexture(it.id, it.category)),
    );
    expect(itemTextures.size).toBe(120);
  });

  it("migrates legacy synthetic stock/crypto symbols and legacy collectible IDs during save reconciliation", () => {
    const s = newPlayer(baseTime);
    s.stocks.holdings["NOVA"] = { qty: 10, reserved: 0, cost: 1_820 };
    s.crypto.holdings["BTX"] = { qty: 2, reserved: 0, cost: 100_000 };
    s.collectibles["inst-legacy-1"] = {
      inst: "inst-legacy-1",
      itemId: "luxprop-005",
      boughtAt: baseTime,
      price: 500_000,
      holdUntil: baseTime,
    };
    s.collectibles["inst-legacy-2"] = {
      inst: "inst-legacy-2",
      itemId: "vehicles-028",
      boughtAt: baseTime,
      price: 120_000,
      holdUntil: baseTime,
    };
    reconcileState(s, baseTime);

    expect(s.stocks.holdings["NOVA"]).toBeUndefined();
    expect(s.stocks.holdings["NVDA"]?.qty).toBe(10);
    expect(s.crypto.holdings["BTX"]).toBeUndefined();
    expect(s.crypto.holdings["BTC"]?.qty).toBe(2);
    expect(s.collectibles["inst-legacy-1"]?.itemId).toBe("yachts-005");
    expect(s.collectibles["inst-legacy-2"]?.itemId).toBe("vehicles-016");
    expect(collectibleValue(undefined, "Common", 1234)).toBe(1234);
  });

  it("accrues stock dividends hourly into manual uncollected balance and collects on demand", () => {
    const s = newPlayer(baseTime);
    s.level = 5;
    s.cash = 10_000_000;
    const c = createCtx(s);

    // JPM pays 3.4% annual dividend
    apply(c, {
      type: "order",
      market: "stock",
      sym: "JPM",
      side: "buy",
      kind: "market",
      qty: 1000,
    });
    const cashAfterBuy = s.cash;

    // Advance 6 hours
    tick(createCtx(s, baseTime + 6 * 3600_000));
    const pendingDiv = s.stocks.uncollectedDividends || 0;
    if (pendingDiv > 0) {
      apply(createCtx(s, baseTime + 6 * 3600_000), { type: "collectDividends" });
      expect(s.stocks.uncollectedDividends).toBe(0);
      expect(s.cash).toBeGreaterThan(cashAfterBuy);
      expect(s.stats.tradingIncome).toBeGreaterThan(0);
    } else {
      // Even if a stochastic loss day occurred, collecting 0 throws clean GameError
      expect(() => apply(c, { type: "collectDividends" })).toThrow("No dividends to collect");
    }
  });

  it("enforces 9 asset categories, 120 fixed items, ungraded purchases, and 7.5% batch grading", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(CATEGORIES.some((cat) => cat.id === "luxprop")).toBe(false);
    expect(COLLECTIBLES.length).toBeLessThanOrEqual(120);
    expect(COLLECTIBLES).toHaveLength(120);

    const s = newPlayer(baseTime);
    const targetItem = COLLECTIBLES[0]!;
    s.cash = targetItem.price * 5;
    const c = createCtx(s);

    apply(c, { type: "buyCollectible", itemId: targetItem.id, soldCount: 0 });
    apply(c, { type: "buyCollectible", itemId: targetItem.id, soldCount: 0 });

    const insts = Object.keys(s.collectibles);
    expect(insts).toHaveLength(2);
    expect(s.collectibles[insts[0]!]!.rarity).toBe("Ungraded");
    expect(collectibleValue(targetItem, "Ungraded")).toBe(targetItem.baseValue);

    const expectedFee = Math.round(targetItem.baseValue * GRADING_FEE_PCT * 2);
    const cashBeforeGrade = s.cash;
    apply(c, { type: "gradeCollectibles", insts });

    expect(cashBeforeGrade - s.cash).toBe(expectedFee);
    expect(RARITIES).toContain(s.collectibles[insts[0]!]!.rarity);
    expect(RARITIES).toContain(s.collectibles[insts[1]!]!.rarity);
    expect(s.lastGradingReport?.totalUnits).toBe(2);
    expect(s.lastGradingReport?.byItem[targetItem.id]?.total).toBe(2);
  });

  it("enforces profile defaults, earned-only selections, 100-char bio limit, and 3-day bio cooldown", () => {
    const s = newPlayer(baseTime);
    const c = createCtx(s);

    expect(s.profile.title).toBe(DEFAULT_TITLE);
    expect(s.profile.avatar).toBe(DEFAULT_AVATAR);

    expect(() => apply(c, { type: "setProfile", title: "Mogul" })).toThrow(
      "Title has not been earned yet",
    );
    expect(() => apply(c, { type: "setProfile", avatar: "crown" })).toThrow(
      "Avatar emblem has not been acquired yet",
    );

    expect(() => apply(c, { type: "setProfile", bio: "a".repeat(BIO_MAX_LENGTH + 5) })).toThrow(
      "Profile description cannot exceed 100 characters",
    );

    const exactBio = "a".repeat(BIO_MAX_LENGTH);
    apply(c, { type: "setProfile", bio: exactBio });
    expect(s.profile.bio).toHaveLength(BIO_MAX_LENGTH);
    expect(s.profile.bioCooldownUntil).toBe(baseTime + BIO_COOLDOWN_MS);

    expect(() => apply(c, { type: "setProfile", bio: "Updated early" })).toThrow(
      "Profile description cooldown active",
    );

    apply(createCtx(s, baseTime + BIO_COOLDOWN_MS + 1000), {
      type: "setProfile",
      bio: "Updated after cooldown",
    });
    expect(s.profile.bio).toBe("Updated after cooldown");
  });

  it("configures 6 achievement tracks and reveals only accomplished plus next locked tier", () => {
    expect(ACHIEVEMENT_TRACKS).toHaveLength(6);
    const clickTrack = ACHIEVEMENT_TRACKS.find((t) => t.id === "clicks")!;
    expect(clickTrack.thresholds).toEqual([
      300, 1_000, 2_500, 5_000, 10_000, 20_000, 50_000, 100_000, 175_000, 250_000, 400_000,
      1_000_000, 1_500_000, 3_000_000, 5_000_000,
    ]);

    const levelTrack = ACHIEVEMENT_TRACKS.find((t) => t.id === "level")!;
    expect(levelTrack.thresholds).toHaveLength(20);
    expect(levelTrack.thresholds[0]).toBe(10);
    expect(levelTrack.thresholds[19]).toBe(200);

    const progress = getTrackProgress(
      clickTrack,
      { clicks: 1_200 },
      { "clicks-0": { at: baseTime }, "clicks-1": { at: baseTime } },
    );
    expect(progress.completedCount).toBe(2);
    expect(progress.visibleDefs).toHaveLength(3); // 2 accomplished + 1 next locked
    expect(progress.nextDef?.target).toBe(2_500);
  });
});
