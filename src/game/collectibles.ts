import { GlobalMods } from "./config";
import { hashStr, mulberry } from "./rng";

export const RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Epic",
  "Legendary",
  "Mythical",
  "Divine",
] as const;
export type Rarity = (typeof RARITIES)[number];
export type AssetGrade = Rarity | "Ungraded";

export const GRADING_FEE_PCT = 0.075; // 7.5% flat fee per graded asset

/** Normalized batch grading odds summing to 100%. */
export const RARITY_DIST: Record<Rarity, number> = {
  Common: 0.48,
  Uncommon: 0.25,
  Rare: 0.1275,
  "Very Rare": 0.0725,
  Epic: 0.04,
  Legendary: 0.02,
  Mythical: 0.0085,
  Divine: 0.0015,
};

/** Fixed resale/valuation boost added to an asset's base unit value based on graded rarity. */
export const RARITY_VALUE_BONUS: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 0.03,
  Rare: 0.05,
  "Very Rare": 0.09,
  Epic: 0.15,
  Legendary: 0.225,
  Mythical: 0.35,
  Divine: 0.7,
};

/** Portfolio global stat bonus multiplier scaled from graded rarity. */
export const RARITY_STAT_BONUS: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 0.0275,
  Rare: 0.033,
  "Very Rare": 0.0415,
  Epic: 0.0525,
  Legendary: 0.0675,
  Mythical: 0.095,
  Divine: 0.15,
};

export const RESALE_PCT = 0.85;
export const HOLD_HOURS = 1;

type CatDef = {
  id: string;
  name: string;
  base: number;
  count: number;
  bonus: keyof GlobalMods | null;
  subs: string[];
  words: string[];
};

/** 9 categories (Luxury Properties removed), 12–16 items per category = 120 items total. */
export const CATEGORIES: CatDef[] = [
  {
    id: "vehicles",
    name: "Vehicles",
    base: 20_000,
    count: 16,
    bonus: "businessPct",
    subs: ["Sports car", "Classic", "SUV", "Supercar"],
    words: [
      "Viper",
      "Comet",
      "Stallion",
      "Phantom",
      "Raptor",
      "Aurora",
      "Vortex",
      "Monza",
      "Spectre",
      "Tempest",
      "Mirage",
      "Nomad",
      "Bolt",
      "Corsair",
      "Duke",
      "Apex",
    ],
  },
  {
    id: "watches",
    name: "Watches",
    base: 5_000,
    count: 16,
    bonus: "clickPct",
    subs: ["Dress", "Diver", "Chronograph", "Tourbillon"],
    words: [
      "Regent",
      "Oyster",
      "Meridian",
      "Calibre",
      "Heritage",
      "Admiral",
      "Equinox",
      "Sovereign",
      "Orbit",
      "Pilot",
      "Horizonte",
      "Chronos",
      "Vanguard",
      "Monarch",
      "Zenith",
      "Valiant",
    ],
  },
  {
    id: "paintings",
    name: "Paintings",
    base: 15_000,
    count: 14,
    bonus: "xpPct",
    subs: ["Impressionist", "Modern", "Renaissance", "Abstract"],
    words: [
      "Twilight",
      "Harbor",
      "Garden",
      "Portrait",
      "Storm",
      "Reverie",
      "Lilies",
      "Mountains",
      "Nocturne",
      "Bloom",
      "Solstice",
      "Horizon",
      "Mirage",
      "Cascade",
    ],
  },
  {
    id: "jewelry",
    name: "Jewelry",
    base: 8_000,
    count: 14,
    bonus: "feeCut",
    subs: ["Ring", "Necklace", "Tiara"],
    words: [
      "Starlight",
      "Royal",
      "Empress",
      "Solitaire",
      "Halo",
      "Cascade",
      "Aurora",
      "Duchess",
      "Eternity",
      "Celeste",
      "Radiant",
      "Imperial",
      "Lumina",
      "Velvet",
    ],
  },
  {
    id: "stamps",
    name: "Stamps",
    base: 500,
    count: 12,
    bonus: "rpPct",
    subs: ["Victorian", "Airmail", "Error print"],
    words: [
      "Penny",
      "Blue",
      "Crown",
      "Eagle",
      "Jubilee",
      "Post",
      "Inverted",
      "Empire",
      "Liberty",
      "Rose",
      "Regent",
      "Hermes",
    ],
  },
  {
    id: "antiques",
    name: "Antiques",
    base: 3_000,
    count: 12,
    bonus: "rentPct",
    subs: ["Furniture", "Porcelain", "Clock"],
    words: [
      "Ming",
      "Louis",
      "Regency",
      "Baroque",
      "Tudor",
      "Georgian",
      "Rococo",
      "Empire",
      "Gothic",
      "Victorian",
      "Byzantine",
      "Venetian",
    ],
  },
  {
    id: "nfts",
    name: "NFTs",
    base: 1_000,
    count: 12,
    bonus: "clickPct",
    subs: ["Generative", "Pixel art", "3D"],
    words: [
      "Ape",
      "Punk",
      "Glitch",
      "Voxel",
      "Cyber",
      "Neon",
      "Meme",
      "Pixel",
      "Void",
      "Drift",
      "Prism",
      "Pulse",
    ],
  },
  {
    id: "aircraft",
    name: "Aircraft",
    base: 400_000,
    count: 12,
    bonus: "offlineHours",
    subs: ["Light jet", "Helicopter", "Business jet"],
    words: [
      "Skyhawk",
      "Albatross",
      "Condor",
      "Swift",
      "Gulf",
      "Falcon",
      "Heron",
      "Osprey",
      "Zephyr",
      "Kite",
      "Nimbus",
      "Stratos",
    ],
  },
  {
    id: "yachts",
    name: "Yachts",
    base: 900_000,
    count: 12,
    bonus: "rentPct",
    subs: ["Sailing yacht", "Motor yacht", "Superyacht"],
    words: [
      "Serenity",
      "Odyssey",
      "Poseidon",
      "Marlin",
      "Coral",
      "Neptune",
      "Siren",
      "Tide",
      "Atlantis",
      "Breeze",
      "Horizon",
      "Valhalla",
    ],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export type CollectibleDef = {
  id: string;
  name: string;
  category: string;
  sub: string;
  price: number;
  baseValue: number;
  bonusKey: keyof GlobalMods | null;
  limited: number | null;
  releaseAt: number | null;
};

function build(): CollectibleDef[] {
  const out: CollectibleDef[] = [];
  for (const cat of CATEGORIES) {
    const r = mulberry(hashStr("cat-v2-" + cat.id));
    for (let i = 0; i < cat.count; i++) {
      const sub = cat.subs[i % cat.subs.length]!;
      const word = cat.words[i % cat.words.length]!;
      const tierScale = Math.pow(1.42, i);
      const jitter = 0.9 + r() * 0.2;
      const baseValue = Math.round(cat.base * tierScale * jitter);
      out.push({
        id: `${cat.id}-${String(i + 1).padStart(3, "0")}`,
        name: `${word} ${sub}`,
        category: cat.id,
        sub,
        price: baseValue,
        baseValue,
        bonusKey: cat.bonus,
        limited: null,
        releaseAt: null,
      });
    }
  }
  return out;
}

export const COLLECTIBLES = build(); // 120 items total
export const COLLECTIBLE_BY_ID = Object.fromEntries(COLLECTIBLES.map((c) => [c.id, c]));

/** Maps legacy 300-item / luxprop collectible IDs cleanly to the active 120-item catalog. */
export function resolveCollectibleId(itemId: string): string {
  if (COLLECTIBLE_BY_ID[itemId]) return itemId;
  const m = /^([a-z]+)-(\d+)$/i.exec(itemId || "");
  if (m) {
    const rawCat = m[1]!.toLowerCase();
    const mappedCat = rawCat === "luxprop" ? "yachts" : rawCat;
    const cat = CATEGORY_BY_ID[mappedCat] ?? CATEGORIES[0]!;
    const idx = Math.max(1, Math.min(cat.count, Number(m[2]) || 1));
    const candidate = `${cat.id}-${String(idx).padStart(3, "0")}`;
    if (COLLECTIBLE_BY_ID[candidate]) return candidate;
  }
  return COLLECTIBLES[0]!.id;
}

/** Rolls a single 1-to-1 randomized rarity according to RARITY_DIST. */
export function rollRarity(rng: () => number = Math.random): Rarity {
  const roll = rng();
  let acc = 0;
  for (const r of RARITIES) {
    acc += RARITY_DIST[r];
    if (roll < acc) return r;
  }
  return "Common";
}

/** Fixed rarity-adjusted valuation (ungraded items retain their base purchase value). */
export function collectibleValue(
  item: CollectibleDef | undefined | null,
  rarity?: AssetGrade,
  fallbackPrice = 0,
): number {
  if (!item) return fallbackPrice;
  if (!rarity || rarity === "Ungraded") return item.baseValue;
  const bonus = RARITY_VALUE_BONUS[rarity] ?? 0;
  return Math.round(item.baseValue * (1 + bonus));
}

/** Fixed portfolio bonus conferred once an item is graded. */
export function collectibleStatBonus(
  item: CollectibleDef | undefined | null,
  rarity?: AssetGrade,
): { key: keyof GlobalMods; value: number } | null {
  if (!item || !item.bonusKey || !rarity || rarity === "Ungraded") return null;
  const pct = RARITY_STAT_BONUS[rarity] ?? 0;
  if (pct <= 0) return null;
  if (item.bonusKey === "offlineHours") {
    return { key: "offlineHours", value: Number((pct * 20).toFixed(2)) };
  }
  return { key: item.bonusKey, value: pct };
}

/** Backwards-compatible alias taking an optional rarity instead of time-based fluctuations. */
export function currentValue(
  item: CollectibleDef | undefined | null,
  rarityOrTime?: AssetGrade | number,
): number {
  if (!item) return 0;
  if (typeof rarityOrTime === "string") {
    return collectibleValue(item, rarityOrTime);
  }
  return item.baseValue;
}

export type CollectionDef = {
  id: string;
  name: string;
  items: string[];
  reward: { cash: number; xp: number };
  bonus: { key: keyof GlobalMods; value: number };
};

function buildCollections(): CollectionDef[] {
  const out: CollectionDef[] = [];
  for (const cat of CATEGORIES) {
    const items = [...COLLECTIBLES.filter((c) => c.category === cat.id)].sort(
      (a, b) => a.price - b.price,
    );
    const starter = items.slice(0, 4);
    if (starter.length >= 3) {
      out.push({
        id: `col-${cat.id}-starter`,
        name: `${cat.name} Starter Set`,
        items: starter.map((c) => c.id),
        reward: { cash: Math.round(cat.base * 1.5), xp: 200 },
        bonus: {
          key: cat.bonus ?? "xpPct",
          value: cat.bonus === "offlineHours" ? 0.5 : 0.01,
        },
      });
    }
    const flagship = items.slice(-4);
    if (flagship.length >= 4 && items.length >= 8) {
      out.push({
        id: `col-${cat.id}-flagship`,
        name: `${cat.name} Connoisseur Set`,
        items: flagship.map((c) => c.id),
        reward: { cash: Math.round(cat.base * 12), xp: 800 },
        bonus: {
          key: cat.bonus ?? "xpPct",
          value: cat.bonus === "offlineHours" ? 1 : 0.02,
        },
      });
    }
  }
  return out;
}

export const COLLECTIONS = buildCollections();
