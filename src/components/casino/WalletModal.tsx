import { useState } from "react";
import { ArrowDownUp, Wallet } from "lucide-react";
import { CASINO_DENOMINATIONS, type CasinoDenomination } from "@/game/config";
import { casinoWalletDollars, chipBreakdown, type CasinoState } from "@/game/casino";
import { useAct } from "@/hooks/use-game";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CasinoChipSvg } from "./casinoTextures";
import { soundFx } from "./soundFx";
import { cn } from "@/lib/utils";

export function WalletModal({
  open,
  onOpenChange,
  cash,
  cs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cash: number;
  cs: CasinoState;
}) {
  const { run, pending } = useAct();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [denom, setDenom] = useState<CasinoDenomination>(100);
  const [qtyStr, setQtyStr] = useState("10");

  const walletUsd = casinoWalletDollars(cs);
  const breakdown = cs.denoms ?? chipBreakdown(walletUsd);
  const qty = Math.max(0, Math.floor(Number(qtyStr) || 0));
  const totalUsd = qty * denom;
  const maxBuy = Math.floor(cash / denom);
  const maxSell = Math.floor(walletUsd / denom);
  const maxQty = mode === "buy" ? maxBuy : maxSell;

  const canSubmit =
    !pending && qty >= 1 && (mode === "buy" ? cash >= totalUsd : walletUsd + 0.001 >= totalUsd);

  async function handleSubmit() {
    if (!canSubmit) return;
    soundFx.chip();
    if (mode === "buy") {
      await run(
        { type: "buyChips", chips: qty, denom },
        `Topped up ${qty} × $${denom.toLocaleString()} chips (${money(totalUsd)})`,
      );
    } else {
      await run(
        { type: "sellChips", chips: qty, denom },
        `Cashed out ${qty} × $${denom.toLocaleString()} chips (${money(totalUsd)})`,
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-slate-700/80 bg-[#0f212e] text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Wallet className="h-5 w-5 text-emerald-400" />
            Digital Chip Wallet
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Convert empire cash into $100, $1,000, or $5,000 casino chips with zero conversion fees.
          </DialogDescription>
        </DialogHeader>

        {/* Live Balances */}
        <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-700/70 bg-[#1a2c38] p-3">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Casino Chip Wallet</div>
            <div className="num mt-0.5 text-lg font-bold text-emerald-400">{money(walletUsd)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-400">Empire Cash</div>
            <div className="num mt-0.5 text-lg font-bold text-slate-100">{money(cash)}</div>
          </div>
        </div>

        {/* 3 Chip Denominations Breakdown */}
        <div>
          <div className="mb-1.5 text-xs font-semibold text-slate-300">
            Select Chip Denomination
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CASINO_DENOMINATIONS.map((d) => {
              const selected = denom === d;
              const held = breakdown[d] ?? 0;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    soundFx.click();
                    setDenom(d);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all",
                    selected
                      ? "border-emerald-400 bg-emerald-500/15 shadow-sm"
                      : "border-slate-700/80 bg-[#1a2c38] hover:border-slate-500",
                  )}
                >
                  <CasinoChipSvg denom={d} size={42} />
                  <div className="num text-xs font-bold text-white">
                    ${d.toLocaleString()} / chip
                  </div>
                  <div className="num text-[11px] text-slate-400">
                    Held: {held.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-up vs Cash-out Mode Switch */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#1a2c38] p-1">
          <button
            type="button"
            onClick={() => setMode("buy")}
            className={cn(
              "rounded-md py-1.5 text-xs font-semibold transition-colors",
              mode === "buy" ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:text-white",
            )}
          >
            Top Up Chips
          </button>
          <button
            type="button"
            onClick={() => setMode("sell")}
            className={cn(
              "rounded-md py-1.5 text-xs font-semibold transition-colors",
              mode === "sell" ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:text-white",
            )}
          >
            Cash Out to Cash
          </button>
        </div>

        {/* Quantity Input + Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <label htmlFor="chip-qty-input" className="font-medium">
              Chip Quantity (${denom.toLocaleString()} each)
            </label>
            <span className="num text-slate-400">Max: {maxQty.toLocaleString()} chips</span>
          </div>
          <div className="flex gap-1.5">
            <Input
              id="chip-qty-input"
              inputMode="numeric"
              value={qtyStr}
              onChange={(e) => setQtyStr(e.target.value.replace(/[^\d]/g, ""))}
              className="num h-10 border-slate-700 bg-[#1a2c38] text-sm font-semibold text-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQtyStr(String(Math.max(1, maxQty)))}
              className="h-10 border-slate-700 bg-[#1a2c38] px-3 text-xs text-slate-200 hover:bg-slate-700"
            >
              Max
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 5, 10, 25].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQtyStr(String(preset))}
                className="h-8 border-slate-700/80 bg-[#1a2c38] text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                {preset}× (${(preset * denom).toLocaleString()})
              </Button>
            ))}
          </div>
        </div>

        {/* Conversion Summary + Submit */}
        <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-[#0b1924] px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ArrowDownUp className="h-3.5 w-3.5" />
            Total Conversion
          </span>
          <span className="num font-bold text-white">{money(totalUsd)}</span>
        </div>

        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          className={cn(
            "h-11 w-full font-bold transition-colors",
            mode === "buy"
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              : "bg-amber-400 text-slate-950 hover:bg-amber-300",
          )}
        >
          {mode === "buy"
            ? `Deposit ${money(totalUsd)} (${qty} × $${denom.toLocaleString()} Chips)`
            : `Cash Out ${money(totalUsd)}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
