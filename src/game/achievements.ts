import { BALANCE } from "./config";

export const TIERS = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"] as const;

export type StatKey =
  | "clicks"
  | "lifetimeEarned"
  | "empireSpent"
  | "assetHoldingsValue"
  | "tradingIncome"
  | "companiesBought"
  | "companiesSold"
  | "branches"
  | "upgrades"
  | "hires"
  | "stockTrades"
  | "cryptoTrades"
  | "dividends"
  | "propertiesBought"
  | "rentEarned"
  | "collectiblesBought"
  | "collectionsDone"
  | "researchDone"
  | "level"
  | "netWorth"
  | "corpContributed"
  | "maintenance"
  | "clickerLevel";

export type AchievementTrack = {
  id: StatKey;
  stat: StatKey;
  name: string;
  description: string;
  titlePrefix: string;
  format: "count" | "level" | "money";
  unitLabel: string;
  thresholds: number[];
  baseRewardCash: number;
};

export type AchievementDef = {
  id: string;
  trackId: StatKey;
  levelIndex: number; // 1-based tier within track
  name: string;
  category: string;
  sub: string;
  tier: (typeof TIERS)[number];
  stat: StatKey;
  target: number;
  reward: { cash: number; xp: number; rp: number };
  secret?: boolean;
  minLevel?: number;
  repeatable?: { growth: number };
};

export const ACHIEVEMENT_TRACKS: AchievementTrack[] = [
  {
    id: "clicks",
    stat: "clicks",
    name: "Lifetime Clicks",
    description: "Cumulative manual taps recorded on the Tapper.",
    titlePrefix: "Tapper",
    format: "count",
    unitLabel: "clicks",
    thresholds: [
      300, 1_000, 2_500, 5_000, 10_000, 20_000, 50_000, 100_000, 175_000, 250_000, 400_000,
      1_000_000, 1_500_000, 3_000_000, 5_000_000,
    ],
    baseRewardCash: 100,
  },
  {
    id: "level",
    stat: "level",
    name: "Level Milestones",
    description: "Reach major Tycoon level milestones up to Level 200.",
    titlePrefix: "Milestone",
    format: "level",
    unitLabel: "level",
    thresholds: Array.from({ length: 20 }, (_, i) => (i + 1) * 10),
    baseRewardCash: 1_500,
  },
  {
    id: "lifetimeEarned",
    stat: "lifetimeEarned",
    name: "Lifetime Money Earned",
    description: "Total gross income accumulated across all sources.",
    titlePrefix: "Rainmaker",
    format: "money",
    unitLabel: "earned",
    thresholds: [
      5_000, 25_000, 100_000, 500_000, 2_000_000, 10_000_000, 50_000_000, 200_000_000,
      1_000_000_000, 5_000_000_000, 25_000_000_000, 100_000_000_000, 500_000_000_000,
      2_500_000_000_000, 10_000_000_000_000, 50_000_000_000_000, 250_000_000_000_000,
      1_000_000_000_000_000, 5_000_000_000_000_000, 25_000_000_000_000_000,
    ],
    baseRewardCash: 500,
  },
  {
    id: "empireSpent",
    stat: "empireSpent",
    name: "Lifetime Empire Spending Investment",
    description: "Capital invested into Businesses, Real Estate, and R&D facilities.",
    titlePrefix: "Builder",
    format: "money",
    unitLabel: "invested",
    thresholds: [
      10_000, 50_000, 250_000, 1_000_000, 5_000_000, 20_000_000, 100_000_000, 500_000_000,
      2_000_000_000, 10_000_000_000, 50_000_000_000, 200_000_000_000, 1_000_000_000_000,
      5_000_000_000_000, 25_000_000_000_000, 100_000_000_000_000, 500_000_000_000_000,
      2_000_000_000_000_000, 10_000_000_000_000_000, 50_000_000_000_000_000,
    ],
    baseRewardCash: 1_000,
  },
  {
    id: "assetHoldingsValue",
    stat: "assetHoldingsValue",
    name: "Asset Management Holding Value",
    description: "Peak combined portfolio value across Stocks, Crypto, and Assets.",
    titlePrefix: "Portfolio",
    format: "money",
    unitLabel: "portfolio value",
    thresholds: [
      25_000, 150_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000,
      100_000_000_000, 1_000_000_000_000, 10_000_000_000_000,
    ],
    baseRewardCash: 2_500,
  },
  {
    id: "tradingIncome",
    stat: "tradingIncome",
    name: "Lifetime Trading Income",
    description: "Realized income generated from Stock & Crypto sales and dividends.",
    titlePrefix: "Financier",
    format: "money",
    unitLabel: "trading income",
    thresholds: [
      10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000,
      100_000_000_000, 1_000_000_000_000, 10_000_000_000_000,
    ],
    baseRewardCash: 1_500,
  },
];

export const ACHIEVEMENT_TRACK_BY_ID: Record<string, AchievementTrack> = Object.fromEntries(
  ACHIEVEMENT_TRACKS.map((t) => [t.id, t]),
);

function toRoman(n: number) {
  const m: [number, string][] = [
    [20, "XX"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let s = "";
  let vLeft = n;
  for (const [v, r] of m) {
    while (vLeft >= v) {
      s += r;
      vLeft -= v;
    }
  }
  return s;
}

function build(): AchievementDef[] {
  const out: AchievementDef[] = [];
  for (const track of ACHIEVEMENT_TRACKS) {
    track.thresholds.forEach((th, i) => {
      const tier = TIERS[Math.min(4, Math.floor((i / track.thresholds.length) * 5))];
      const mult = BALANCE.achievementTierMult[tier];
      const R = BALANCE.achievementReward;
      out.push({
        id: `${track.id}-${i}`,
        trackId: track.id,
        levelIndex: i + 1,
        name: `${track.titlePrefix} ${toRoman(i + 1)}`,
        category: track.name,
        sub: `Tier ${i + 1} / ${track.thresholds.length}`,
        tier,
        stat: track.stat,
        target: th,
        reward: {
          cash: Math.round(track.baseRewardCash * mult * Math.pow(R.cashGrowth, Math.min(i, 12))),
          xp: 0,
          rp: i >= 3 ? Math.round(R.rpBase * mult * (i + 1)) : 0,
        },
      });
    });
  }
  return out;
}

export const ACHIEVEMENTS = build();
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
export const ACHIEVEMENTS_BY_TRACK: Record<string, AchievementDef[]> = Object.fromEntries(
  ACHIEVEMENT_TRACKS.map((t) => [t.id, ACHIEVEMENTS.filter((a) => a.trackId === t.id)]),
);

export function getTrackProgress(
  track: AchievementTrack,
  stats: Partial<Record<StatKey, number>>,
  unlockedMap: Record<string, { at: number; cycle?: number }>,
) {
  const defs = ACHIEVEMENTS_BY_TRACK[track.id] ?? [];
  const currentValue = stats[track.stat] ?? 0;
  let completedCount = 0;
  for (const d of defs) {
    if (unlockedMap[d.id] || currentValue >= d.target) {
      completedCount += 1;
    } else {
      break;
    }
  }
  const nextDef = defs[completedCount] ?? null;
  const visibleDefs = defs.slice(0, Math.min(defs.length, completedCount + 1));
  return {
    track,
    defs,
    visibleDefs,
    completedCount,
    totalTiers: defs.length,
    currentValue,
    nextDef,
  };
}

export function repeatTarget(a: AchievementDef, cycle: number) {
  return Math.ceil(a.target * Math.pow(a.repeatable?.growth ?? 1.15, cycle) * (cycle + 1));
}
