import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { useGame, useOptimisticTaps } from "@/hooks/use-game";
import { clickBase, mult, personalMods } from "@/game/engine";
import { corpMods } from "@/game/corp";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PersonalBalanceBadgeProps {
  className?: string;
  compact?: boolean;
  /** Render inside the persistent AppShell top bar or a modal sheet header */
  inline?: boolean;
}

/**
 * Compact cash balance pill used in the unified AppShell top bar and purchase sheets.
 * Legacy per-page calls without `inline` return null to avoid duplicate balance badges on screen.
 */
export function PersonalBalanceBadge({ className, inline = false }: PersonalBalanceBadgeProps) {
  const { data } = useGame();
  const value = useMemo(() => {
    if (!data) return 0;
    const p = personalMods(data.state);
    const cm = corpMods(data.corp);
    return clickBase(data.state.clicker.level) * mult("clickPct", p, cm);
  }, [data]);
  const opt = useOptimisticTaps(data, value);

  if (!inline || !data) return null;
  const cash = data.state.cash + opt.cash;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-card/90 px-2.5 py-1 backdrop-blur-md shadow-xs shrink-0",
        className,
      )}
      title={`Cash Balance: ${money(cash)}`}
    >
      <Wallet className="h-3.5 w-3.5 text-gold shrink-0" />
      <span className="num text-xs font-bold text-gain whitespace-nowrap">{money(cash)}</span>
    </div>
  );
}
