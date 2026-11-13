import { cn } from "@/lib/utils";
import { collectibleCategoryTexture, collectibleItemTexture, cryptoLogo, stockLogo } from "./art";
import type { AssetGrade } from "@/game/collectibles";

export const RARITY_TONE: Record<AssetGrade, string> = {
  Ungraded: "text-muted-foreground border-border/80",
  Common: "text-muted-foreground border-border",
  Uncommon: "text-gain border-gain/40",
  Rare: "text-sky-400 border-sky-400/40",
  "Very Rare": "text-indigo-400 border-indigo-400/40",
  Epic: "text-primary border-primary/50",
  Legendary: "text-gold border-gold/50",
  Mythical: "text-loss border-loss/50",
  Divine: "text-amber-300 border-amber-300/70",
};

/**
 * Circular display frame with zoomed texture fitting for Stock Exchange companies
 * and CryptoTrade Exchange tokens.
 */
export function MarketLogo({
  market,
  symbol,
  sector,
  className,
}: {
  market: "stock" | "crypto";
  symbol: string;
  sector?: string;
  className?: string;
}) {
  const src = market === "stock" ? stockLogo(symbol, sector ?? "Technology") : cryptoLogo(symbol);
  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-card shadow-inner",
        className,
      )}
    >
      <img
        src={src}
        alt={symbol}
        referrerPolicy="no-referrer"
        className="h-full w-full scale-[1.28] rounded-full object-cover object-center"
        loading="lazy"
      />
    </div>
  );
}

export function CollectibleIcon({
  category,
  itemId,
  rarity = "Ungraded",
  className,
}: {
  category: string;
  itemId?: string;
  rarity?: AssetGrade;
  className?: string;
}) {
  const src = itemId
    ? collectibleItemTexture(itemId, category)
    : collectibleCategoryTexture(category);
  return (
    <div
      className={cn(
        "game-panel relative flex items-center justify-center overflow-hidden rounded-xl border bg-muted/60",
        RARITY_TONE[rarity],
        className,
      )}
    >
      <img
        src={src}
        alt={itemId ?? category}
        referrerPolicy="no-referrer"
        className="h-full w-full scale-[1.08] object-cover object-center"
        loading="lazy"
      />
    </div>
  );
}
