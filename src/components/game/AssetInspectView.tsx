import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { cryptoNow, feePct, personalMods, stocksNow, UNLOCKS } from "@/game/engine";
import { corpMods } from "@/game/corp";
import {
  cryptoLiquidity,
  cryptoPriceAtTick,
  cryptoTick,
  cryptoTickTime,
  series,
  stockLiquidity,
  stockPriceAtTick,
  stockTick,
  stockTickTime,
} from "@/game/market";
import { money, num, pct, price } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  Loading,
  MiniChart,
  RangeTabs,
  Row,
  Segmented,
  useRange,
} from "@/components/game/ui";
import { MarketLogo } from "@/components/game/CollectibleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderKind } from "@/game/types";

export function AssetInspectView({
  market,
  sym,
  onClose,
}: {
  market: "stock" | "crypto";
  sym: string;
  onClose?: () => void;
}) {
  const isStock = market === "stock";
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 5000);
  const { run, pending } = useAct();
  const { range, setRange, ms } = useRange();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [kind, setKind] = useState<OrderKind>("market");
  const [qty, setQty] = useState("");
  const [limit, setLimit] = useState("");

  const st = stocksNow(now);
  const cr = cryptoNow(now);
  const sd = isStock ? st.map[sym] : undefined;
  const cd = !isStock ? cr.map[sym] : undefined;

  const chart = useMemo(() => {
    if (sd)
      return series(
        (k) => stockPriceAtTick(sd, k),
        stockTick,
        stockTickTime,
        Math.max(sd.listedAt, now - ms),
        now,
        80,
      );
    if (cd)
      return series(
        (k) => cryptoPriceAtTick(cd, k),
        cryptoTick,
        cryptoTickTime,
        Math.max(cd.listedAt, now - ms),
        now,
        80,
      );
    return [];
  }, [sd, cd, now, ms]);

  if (!data) return <Loading />;
  if (!sd && !cd) return <Empty title="Asset not found" />;

  const s = data.state;
  const p = isStock
    ? stockPriceAtTick(sd!, stockTick(now))
    : cryptoPriceAtTick(cd!, cryptoTick(now));
  const pMods = personalMods(s);
  const fee = feePct(isStock ? "stock" : "crypto", pMods, corpMods(data.corp));
  const h = (isStock ? s.stocks.holdings : s.crypto.holdings)[sym];
  const q = Number(qty) || 0;
  const execPrice = kind === "market" ? p : Number(limit) || p;
  const gross = q * execPrice;
  const feeAmt = gross * fee;
  const locked = s.level < (isStock ? UNLOCKS.stocks : UNLOCKS.crypto);
  const baseLiq = isStock
    ? stockLiquidity(sd!, stockTick(now))
    : cryptoLiquidity(cd!, cryptoTick(now));
  const liq = baseLiq * (1 + (pMods.tradeLimitPct ?? 0));

  const kinds: { id: OrderKind; label: string }[] = isStock
    ? [
        { id: "market", label: "Market" },
        { id: "limit", label: "Limit" },
      ]
    : side === "buy"
      ? [
          { id: "market", label: "Market" },
          { id: "limit", label: "Limit" },
        ]
      : [
          { id: "market", label: "Market" },
          { id: "limit", label: "Limit" },
          { id: "stop", label: "Stop-loss" },
          { id: "tp", label: "Take-profit" },
        ];

  function submit() {
    run(
      {
        type: "order",
        market: isStock ? "stock" : "crypto",
        sym,
        side,
        kind,
        qty: q,
        ...(kind === "limit" ? { limit: Number(limit) } : {}),
        ...(kind === "stop" || kind === "tp" ? { trigger: Number(limit) } : {}),
      },
      kind === "market" ? "Order executed" : "Order placed",
    ).then(() => {
      setQty("");
      if (onClose) onClose();
    });
  }

  return (
    <div className="space-y-3 pb-2">
      {onClose ? (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <MarketLogo
              market={isStock ? "stock" : "crypto"}
              symbol={sym}
              sector={sd?.sector}
              className="h-9 w-9"
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight">{sym}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {sd?.name ?? cd?.name} · {sd?.sector ?? `${cd?.profile} volatility`}
              </p>
            </div>
          </div>
          <div className="num shrink-0 text-lg font-bold">{price(p)}</div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Link
              to="/markets"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Asset Management
            </Link>
          </div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <MarketLogo
                market={isStock ? "stock" : "crypto"}
                symbol={sym}
                sector={sd?.sector}
                className="h-11 w-11"
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold">{sym}</h1>
                <p className="truncate text-sm text-muted-foreground">
                  {sd?.name ?? cd?.name} · {sd?.sector ?? `${cd?.profile} volatility`}
                </p>
              </div>
            </div>
            <div className="num shrink-0 text-2xl font-bold">{price(p)}</div>
          </div>
        </>
      )}

      <Card>
        <MiniChart data={chart} height={150} format={price} />
        <div className="mt-2">
          <RangeTabs value={range} onChange={setRange} />
        </div>
      </Card>

      <Card>
        <Segmented
          value={side}
          onChange={(v) => {
            setSide(v);
            setKind("market");
          }}
          options={[
            { id: "buy", label: "Buy" },
            { id: "sell", label: "Sell" },
          ]}
        />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {kinds.map((k) => (
            <Button
              variant="ghost"
              size="sm"
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-md px-3 py-1 text-xs whitespace-nowrap ${kind === k.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {k.label}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Input
            inputMode="decimal"
            placeholder={`Quantity${isStock ? " (whole shares)" : ""}`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="h-10 text-xs"
          />
          {kind !== "market" && (
            <Input
              inputMode="decimal"
              placeholder={kind === "limit" ? "Limit price" : "Trigger price"}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="h-10 text-xs"
            />
          )}
        </div>
        <div className="mt-2 text-xs">
          <Row label="Available Cash" value={money(s.cash)} />
          <Row label="Estimated value" value={money(gross)} />
          <Row label={`Fee (${pct(fee, 3)})`} value={money(feeAmt)} />
          <Row
            label={side === "buy" ? "Total cost" : "Proceeds"}
            value={money(side === "buy" ? gross + feeAmt : gross - feeAmt)}
          />
          <Row
            label="Owned"
            value={
              h
                ? `${h.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}${h.reserved ? ` (${h.reserved} reserved)` : ""}`
                : "0"
            }
          />
          <Row label="Liquidity per update" value={num(liq, 2)} />
        </div>
        {kind === "market" && q > liq && (
          <p className="mt-1 text-xs text-warn">
            Only ~{num(liq, 2)} available now — the rest of a market order will be cancelled (no fee
            on unfilled part).
          </p>
        )}
        {(kind === "stop" || kind === "tp") && (
          <p className="mt-1 text-xs text-muted-foreground">
            Executes at the next market price after triggering — not guaranteed across price gaps.
          </p>
        )}
        <Confirm
          trigger={
            <Button
              className="mt-3 h-10 w-full bg-gradient-primary text-xs font-semibold"
              disabled={locked || pending || q <= 0}
            >
              {locked
                ? `Unlocks at Level ${isStock ? UNLOCKS.stocks : UNLOCKS.crypto}`
                : `Review ${side} order`}
            </Button>
          }
          title={`Confirm ${kind} ${side}`}
          description={
            <>
              {q} {sym}{" "}
              {kind === "market"
                ? `at ~${price(p)}`
                : `${kind === "limit" ? "limit" : "trigger"} ${price(Number(limit) || 0)}`}
              . Fee {pct(fee, 3)} charged only on filled quantity
              {kind !== "market" && side === "buy"
                ? "; funds are reserved until filled or cancelled"
                : ""}
              .
            </>
          }
          onConfirm={submit}
        />
      </Card>
    </div>
  );
}
