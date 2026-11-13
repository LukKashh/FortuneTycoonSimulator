import { CASINO } from "@/game/config";
import { casinoWalletDollars, type CasinoState } from "@/game/casino";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function BetAmountControl({
  betUsd,
  setBetUsd,
  cs,
  disabled,
}: {
  betUsd: string;
  setBetUsd: (v: string) => void;
  cs: CasinoState;
  disabled?: boolean;
}) {
  const walletUsd = casinoWalletDollars(cs);
  const val = Math.max(0, Number(betUsd) || 0);
  const minUsd = CASINO.minBet * CASINO.chipValue;
  const maxUsd = Math.min(walletUsd, CASINO.maxBet * CASINO.chipValue);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor="casino-bet-amount" className="font-semibold text-slate-300">
          Bet Amount
        </label>
        <span className="num text-slate-400">Wallet: {money(walletUsd)}</span>
      </div>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
            $
          </span>
          <Input
            id="casino-bet-amount"
            inputMode="decimal"
            value={betUsd}
            disabled={disabled}
            onChange={(e) => setBetUsd(e.target.value.replace(/[^\d.]/g, ""))}
            className="num h-10 border-slate-700 bg-[#0f212e] pl-6 font-semibold text-white"
            aria-label="Bet amount in dollars"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setBetUsd(String(Math.max(minUsd, Math.floor(val / 2))))}
          className="h-10 border-slate-700 bg-[#0f212e] px-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          ½
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            setBetUsd(String(Math.max(minUsd, Math.min(maxUsd || minUsd, Math.floor(val * 2)))))
          }
          className="h-10 border-slate-700 bg-[#0f212e] px-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          2×
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setBetUsd(String(Math.floor(Math.max(minUsd, maxUsd))))}
          className="h-10 border-slate-700 bg-[#0f212e] px-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          Max
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[100, 500, 1000, 5000].map((chipAmt) => (
          <button
            key={chipAmt}
            type="button"
            disabled={disabled}
            onClick={() => setBetUsd(String(chipAmt))}
            className={cn(
              "num rounded-md border py-1 text-[11px] font-semibold transition-colors",
              val === chipAmt
                ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-300"
                : "border-slate-700/80 bg-[#0f212e] text-slate-300 hover:border-slate-500",
            )}
          >
            ${chipAmt >= 1000 ? `${chipAmt / 1000}K` : chipAmt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GameOutcomeBanner({
  cs,
  gameKey,
  label,
}: {
  cs: CasinoState;
  gameKey: string;
  label?: string;
}) {
  const last = cs.last;
  if (!last || last.game !== gameKey) return null;
  const betUsd = last.bet * CASINO.chipValue;
  const payoutUsd = last.payout * CASINO.chipValue;
  const netUsd = payoutUsd - betUsd;
  const won = netUsd > 0;
  const push = Math.abs(netUsd) < 0.01;
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all",
        won
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
          : push
            ? "border-slate-600 bg-slate-800/60 text-slate-300"
            : "border-rose-500/40 bg-rose-500/10 text-rose-300",
      )}
    >
      {label ? `${label} · ` : ""}
      {won
        ? `Won ${money(payoutUsd)} (+${money(netUsd)})`
        : push
          ? `Push — ${money(betUsd)} returned`
          : `Lost ${money(betUsd)}`}
    </div>
  );
}
