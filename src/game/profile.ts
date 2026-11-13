import type { PlayerState } from "./types";

export const DEFAULT_TITLE = "Entrepreneur";
export const DEFAULT_AVATAR = "briefcase";
export const BIO_MAX_LENGTH = 100;
export const BIO_COOLDOWN_MS = 3 * 86400_000; // 3 days

export type AvatarDef = {
  id: string;
  label: string;
  unlockDesc: string;
};

export const AVATAR_DEFS: AvatarDef[] = [
  { id: "briefcase", label: "Suitcase", unlockDesc: "Starter emblem" },
  { id: "star", label: "Star", unlockDesc: "Reach Player Level 5" },
  { id: "rocket", label: "Rocket", unlockDesc: "Reach 5,000 Lifetime Clicks" },
  { id: "gem", label: "Gem", unlockDesc: "Own 5 Graded Assets" },
  { id: "crown", label: "Crown", unlockDesc: "Reach Player Level 25" },
];

export type TitleDef = {
  id: string;
  label: string;
  unlockDesc: string;
};

export const TITLE_DEFS: TitleDef[] = [
  { id: "Entrepreneur", label: "Entrepreneur", unlockDesc: "Starter title" },
  { id: "Operator", label: "Operator", unlockDesc: "Own 3 Businesses or Properties" },
  { id: "Financier", label: "Financier", unlockDesc: "Reach $100K Trading Income" },
  { id: "Mogul", label: "Mogul", unlockDesc: "Reach Player Level 10" },
  { id: "Magnate", label: "Magnate", unlockDesc: "Reach Player Level 25" },
  { id: "Industrialist", label: "Industrialist", unlockDesc: "Reach $10M Empire Investment" },
  { id: "Grandmaster", label: "Grandmaster", unlockDesc: "Unlock 25 Achievements" },
  { id: "Sovereign", label: "Sovereign", unlockDesc: "Reach Player Level 100" },
];

export function earnedTitles(s: PlayerState): string[] {
  const titles = [DEFAULT_TITLE];
  const holdingsCount =
    Object.keys(s.companies || {}).length + Object.keys(s.properties || {}).length;
  if (holdingsCount >= 3 || s.achievements["empireSpent-1"]) titles.push("Operator");
  if ((s.stats?.tradingIncome ?? 0) >= 100_000 || s.achievements["tradingIncome-1"]) {
    titles.push("Financier");
  }
  if ((s.level ?? 1) >= 10 || s.achievements["level-0"]) titles.push("Mogul");
  if ((s.level ?? 1) >= 25) titles.push("Magnate");
  if ((s.stats?.empireSpent ?? 0) >= 10_000_000) titles.push("Industrialist");
  if (Object.keys(s.achievements || {}).length >= 25) titles.push("Grandmaster");
  if ((s.level ?? 1) >= 100 || s.achievements["level-9"]) titles.push("Sovereign");
  return titles;
}

export function ownedAvatars(s: PlayerState): string[] {
  const owned = new Set<string>([DEFAULT_AVATAR, ...(s.profile?.ownedAvatars ?? [])]);
  if ((s.level ?? 1) >= 5) owned.add("star");
  if ((s.stats?.clicks ?? 0) >= 5_000 || s.achievements["clicks-3"]) owned.add("rocket");
  const gradedCount = Object.values(s.collectibles || {}).filter(
    (c) => c.rarity && c.rarity !== "Ungraded",
  ).length;
  if (gradedCount >= 5) owned.add("gem");
  if ((s.level ?? 1) >= 25) owned.add("crown");
  return AVATAR_DEFS.map((a) => a.id).filter((id) => owned.has(id));
}
