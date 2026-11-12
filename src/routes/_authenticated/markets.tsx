import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gem, LineChart, ListOrdered, Lock, Wallet } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { cryptoNow, stocksNow, UNLOCKS } from "@/game/engine";
import {
  cryptoPriceAtTick,
  cryptoTick,
  stockPriceAtTick,
  stockTick,
  upcomingStockListing,
} from "@/game/market";
import {
  CATEGORIES,
  COLLECTIBLES,
  COLLECTIBLE_BY_ID,
  COLLECTIONS,
  RARITIES,
  currentValue,
  demandLabel,
} from "@/game/collectibles";
import { getCollectibleStock } from "@/lib/game.functions";
import { date, duration, money, pct, price } from "@/lib/format";
import {
  Card,
  Empty,
  GameScrollContainer,
  Loading,
  Pill,
  Progress,
  Segmented,
} from "@/components/game/ui";
import { CollectibleIcon } from "@/components/game/CollectibleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetInspectView } from "@/components/game/AssetInspectView";

export const Route = createFileRoute("/_authenticated/markets")({
  validateSearch: (s: Record<string, unknown>): { tab?: "stocks" | "crypto" | "assets" } => ({
    ...(s.tab === "assets"
      ? { tab: "assets" as const }
      : s.tab === "crypto"
        ? { tab: "crypto" as const }
        : s.tab === "stocks"
          ? { tab: "stocks" as const }
          : {}),
  }),
  head: () => ({
    meta: [
      { title: "Asset Management — Stocks, Crypto & Assets · Capitalfortune" },
      { name: "description", content: "Manage stocks, crypto, and luxury collectible assets." },
      {
        property: "og:title",
        content: "Asset Management — Stocks, Crypto & Assets · Capitalfortune",
      },
      {
        property: "og:description",
        content: "Manage stocks, crypto, and luxury collectible assets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketsRoutePage,
});

type HubTab = "stocks" | "crypto" | "assets";
type StockFilter = "growth" | "dip" | "dividends" | "marketCapDesc" | "marketCapAsc";
type CryptoFilter = "growth" | "dip" | "stables" | "volatility";

function MarketsRoutePage() {
  const search = Route.useSearch();
  return <TradeHubScreen initialTab={search.tab ?? "stocks"} />;
}

export function TradeHubScreen({ initialTab = "stocks" }: { initialTab?: HubTab }) {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 10_000);
  const { run, pending } = useAct();
  const [tab, setTab] = useState<HubTab>(initialTab);

  // Separate Menu Toggles for each domain (2.1 Stocks, 2.2 Crypto, 2.3 Assets)
  const [stockMenu, setStockMenu] = useState<"market" | "portfolio">("market");
  const [cryptoMenu, setCryptoMenu] = useState<"market" | "portfolio">("market");
  const [assetMenu, setAssetMenu] = useState<"market" | "portfolio" | "collections">("market");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Selected stock/crypto asset for modal inspection
  const [selectedAsset, setSelectedAsset] = useState<{
    market: "stock" | "crypto";
    sym: string;
  } | null>(null);

  // Stock & Crypto filters + pagination
  const [stockFilter, setStockFilter] = useState<StockFilter>("growth");
  const [cryptoFilter, setCryptoFilter] = useState<CryptoFilter>("growth");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  // Assets (Collectibles) state
  const { data: stock } = useQuery({
    queryKey: ["collectible-stock"],
    queryFn: () => getCollectibleStock(),
    staleTime: 30_000,
  });
  const [cat, setCat] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [edition, setEdition] = useState("all");
  const [q, setQ] = useState("");
  const [assetPage, setAssetPage] = useState(1);
  const assetPageSize = 12;

  const st = stocksNow(now);
  const cr = cryptoNow(now);

  const rows = useMemo(() => {
    const sk = stockTick(now);
    const ck = cryptoTick(now);

    const stockRows = st.list.map((s) => {
      const p = stockPriceAtTick(s, sk);
      const prev = stockPriceAtTick(s, sk - 288);
      const cap = p * s.shares;
      return { s, p, ch: p / prev - 1, cap };
    });

    const cryptoRows = cr.list.map((c) => {
      const p = cryptoPriceAtTick(c, ck);
      const prev = cryptoPriceAtTick(c, ck - 720);
      return { c, p, ch: p / prev - 1 };
    });

    if (stockFilter === "growth") stockRows.sort((a, b) => b.ch - a.ch);
    else if (stockFilter === "dip") stockRows.sort((a, b) => a.ch - b.ch);
    else if (stockFilter === "dividends")
      stockRows.sort((a, b) => b.s.dividendYield - a.s.dividendYield);
    else if (stockFilter === "marketCapDesc") stockRows.sort((a, b) => b.cap - a.cap);
    else if (stockFilter === "marketCapAsc") stockRows.sort((a, b) => a.cap - b.cap);

    const volMap: Record<string, number> = {
      low: 1,
      moderate: 2,
      high: 3,
      "very high": 4,
      extreme: 5,
    };
    if (cryptoFilter === "growth") cryptoRows.sort((a, b) => b.ch - a.ch);
    else if (cryptoFilter === "dip") cryptoRows.sort((a, b) => a.ch - b.ch);
    else if (cryptoFilter === "stables")
      cryptoRows.sort((a, b) => (volMap[a.c.profile] ?? 99) - (volMap[b.c.profile] ?? 99));
    else if (cryptoFilter === "volatility")
      cryptoRows.sort((a, b) => (volMap[b.c.profile] ?? 0) - (volMap[a.c.profile] ?? 0));

    return { stocks: stockRows, crypto: cryptoRows };
  }, [now, st, cr, stockFilter, cryptoFilter]);

  const assetItems = useMemo(() => {
    const arr = COLLECTIBLES.map((it) => {
      const v = currentValue(it, now);
      const prev = currentValue(it, now - 7 * 86400_000);
      const sold = stock?.[it.id] ?? 0;
      const released = !it.releaseAt || it.releaseAt <= now;
      const left = it.limited ? it.limited - sold : Infinity;
      return { it, v, ch: v / prev - 1, left, released, demand: demandLabel(it, now) };
    }).filter(
      (x) =>
        (cat === "all" || x.it.category === cat) &&
        (rarity === "all" || x.it.rarity === rarity) &&
        (edition === "all" || (edition === "limited" ? !!x.it.limited : !x.it.limited)) &&
        (!q || x.it.name.toLowerCase().includes(q.toLowerCase())),
    );
    arr.sort((a, b) => a.it.price - b.it.price);
    return arr;
  }, [now, stock, cat, rarity, edition, q]);

  if (!data) return <Loading />;
  const s = data.state;
  const upcoming = upcomingStockListing(now);
  const inv = Object.values(s.collectibles);
  const ownedSet = new Set(inv.map((o) => o.itemId));

  const stockHoldings = Object.entries(s.stocks.holdings).map(([sym, h]) => {
    const d = st.map[sym];
    const p = d ? stockPriceAtTick(d, stockTick(now)) : 0;
    const dy = d && d.dividendYield > 0 ? d.dividendYield : 0;
    return {
      market: "stock" as const,
      sym,
      name: d?.name ?? sym,
      h,
      value: h.qty * p,
      pl: h.qty * p - h.cost,
      dy,
      divDay: (h.qty * p * dy) / 365,
    };
  });

  const cryptoHoldings = Object.entries(s.crypto.holdings).map(([sym, h]) => {
    const d = cr.map[sym];
    const p = d ? cryptoPriceAtTick(d, cryptoTick(now)) : 0;
    return {
      market: "crypto" as const,
      sym,
      name: d?.name ?? sym,
      h,
      value: h.qty * p,
      pl: h.qty * p - h.cost,
    };
  });

  const stocksTotalVal = stockHoldings.reduce((t, h) => t + h.value, 0);
  const stocksTotalPl = stockHoldings.reduce((t, h) => t + h.pl, 0);
  const stocksDivDay = stockHoldings.reduce((t, h) => t + h.divDay, 0);
  const stockOrders = s.orders.filter((o) => o.market === "stock");

  const cryptoTotalVal = cryptoHoldings.reduce((t, h) => t + h.value, 0);
  const cryptoTotalPl = cryptoHoldings.reduce((t, h) => t + h.pl, 0);
  const cryptoOrders = s.orders.filter((o) => o.market === "crypto");

  const assetsTotalValue = inv.reduce((acc, o) => {
    const it = COLLECTIBLE_BY_ID[o.itemId];
    return acc + (it ? currentValue(it, now) : o.price);
  }, 0);
  const assetsTotalPl = inv.reduce((acc, o) => {
    const it = COLLECTIBLE_BY_ID[o.itemId];
    return acc + ((it ? currentValue(it, now) : o.price) - o.price);
  }, 0);

  const activeRows = tab === "stocks" ? rows.stocks : rows.crypto;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Asset Management Gateway Selector */}
      <div className="shrink-0 space-y-1.5 mb-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-sm font-extrabold tracking-tight text-foreground">
            Asset Management
          </h1>
          <span className="text-[10px] font-medium text-muted-foreground">
            {tab === "stocks"
              ? "Equities & Dividends"
              : tab === "crypto"
                ? "24/7 Digital Tokens"
                : "Luxury Collectibles"}
          </span>
        </div>

        {/* Gateway Domain Switcher: Stocks | Crypto | Assets */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border/80 bg-card/85 p-1">
          {(
            [
              {
                id: "stocks",
                label: "Stocks",
                sub: `${stockHoldings.length} owned`,
                icon: LineChart,
              },
              {
                id: "crypto",
                label: "Crypto",
                sub: `${cryptoHoldings.length} owned`,
                icon: Wallet,
              },
              {
                id: "assets",
                label: "Assets",
                sub: `${inv.length} owned`,
                icon: Gem,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setPage(1);
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-1.5 px-2 transition ${
                tab === item.id
                  ? "bg-gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold">
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[9px] font-mono ${
                  tab === item.id ? "text-primary-foreground/85" : "text-muted-foreground"
                }`}
              >
                {item.sub}
              </span>
            </button>
          ))}
        </div>

        {/* 2.1 Stock Menu Toggle */}
        {tab === "stocks" && (
          <Segmented
            value={stockMenu}
            onChange={setStockMenu}
            options={[
              { id: "market", label: "Market Listings" },
              {
                id: "portfolio",
                label: `Portfolio of Owned (${stockHoldings.length})`,
              },
            ]}
          />
        )}

        {/* 2.2 Crypto Menu Toggle */}
        {tab === "crypto" && (
          <Segmented
            value={cryptoMenu}
            onChange={setCryptoMenu}
            options={[
              { id: "market", label: "Market Listings" },
              {
                id: "portfolio",
                label: `Portfolio of Owned (${cryptoHoldings.length})`,
              },
            ]}
          />
        )}

        {/* 2.3 Assets Menu Toggle */}
        {tab === "assets" && (
          <Segmented
            value={assetMenu}
            onChange={setAssetMenu}
            options={[
              { id: "market", label: "Market Listings" },
              { id: "portfolio", label: `Portfolio of Owned (${inv.length})` },
              { id: "collections", label: "Sets" },
            ]}
          />
        )}
      </div>

      {/* 2.1 STOCKS HOME SCREEN */}
      {tab === "stocks" && (
        <GameScrollContainer>
          {stockMenu === "market" ? (
            <>
              {s.level < UNLOCKS.stocks && (
                <Card className="mb-1.5 flex items-center gap-2 border-warn/40 py-1.5 px-2.5 text-xs">
                  <Lock className="h-3.5 w-3.5 text-warn shrink-0" />
                  <span>Unlocks at Level {UNLOCKS.stocks}.</span>
                </Card>
              )}

              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                  {(
                    [
                      { id: "growth" as const, label: "Gainers" },
                      { id: "dip" as const, label: "Losers" },
                      { id: "dividends" as const, label: "Dividends" },
                      { id: "marketCapDesc" as const, label: "Large Cap" },
                      { id: "marketCapAsc" as const, label: "Small Cap" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setStockFilter(f.id);
                        setPage(1);
                      }}
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                        stockFilter === f.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground hidden sm:inline">
                  IPO: {upcoming.name} ({duration(upcoming.at - now)})
                </span>
              </div>

              {(pagedRows as typeof rows.stocks).map((r) => (
                <div
                  key={r.s.ticker}
                  onClick={() => setSelectedAsset({ market: "stock", sym: r.s.ticker })}
                  className="game-market-row flex cursor-pointer items-center justify-between gap-2 px-2.5 py-2"
                >
                  <span className="game-market-monogram">{r.s.ticker.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                      <span>{r.s.ticker}</span>
                      {r.s.generated && <Pill tone="primary">New</Pill>}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">{r.s.name}</div>
                  </div>
                  <Sparkline
                    values={Array.from({ length: 18 }, (_, i) =>
                      stockPriceAtTick(r.s, stockTick(now) - (17 - i) * 16),
                    )}
                    up={r.ch >= 0}
                  />
                  <div className="shrink-0 text-right">
                    <div className="num text-xs sm:text-sm font-semibold">{price(r.p)}</div>
                    <div className={`num text-[11px] ${r.ch >= 0 ? "text-gain" : "text-loss"}`}>
                      {pct(r.ch, 2, true)}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="mt-2 mb-1 flex items-center justify-between border-t border-border/60 pt-2 px-1 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    Prev
                  </Button>
                  <div className="font-mono text-muted-foreground text-[11px]">
                    <span className="font-bold text-foreground">{currentPage}</span> / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              <Card className="border-primary/35 bg-card/90 p-2.5">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Equities Value</div>
                    <div className="num text-sm font-bold text-foreground">
                      {money(stocksTotalVal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Unrealized P/L</div>
                    <div
                      className={`num text-sm font-bold ${stocksTotalPl >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {money(stocksTotalPl, { sign: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Dividends /d</div>
                    <div className="num text-sm font-bold text-gain">{money(stocksDivDay)}</div>
                  </div>
                </div>
              </Card>

              {stockHoldings.length === 0 ? (
                <Empty
                  title="No stocks owned"
                  text="Buy shares from the Stock Market Listings to build your equity portfolio."
                  action={
                    <Button size="sm" onClick={() => setStockMenu("market")}>
                      Browse Stock Listings
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  {stockHoldings.map((h) => (
                    <Card
                      key={h.sym}
                      onClick={() => setSelectedAsset({ market: "stock", sym: h.sym })}
                      className="flex cursor-pointer items-center justify-between p-2.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                          <span>{h.sym}</span>
                          <span className="truncate text-[10px] font-normal text-muted-foreground">
                            {h.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {h.h.qty.toLocaleString()} shares · Div {money(h.divDay)}/d
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="num text-xs sm:text-sm font-semibold">{money(h.value)}</div>
                        <div className={`num text-[10px] ${h.pl >= 0 ? "text-gain" : "text-loss"}`}>
                          {money(h.pl, { sign: true })}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {stockOrders.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
                    <ListOrdered className="h-3.5 w-3.5" />
                    <span>Stock Orders ({stockOrders.length})</span>
                  </div>
                  {stockOrders.map((o) => (
                    <Card key={o.id} className="p-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-xs">
                            {o.side.toUpperCase()} {o.sym}{" "}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {o.kind}
                              {o.limit ? ` @ ${price(o.limit)}` : ""}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {o.filled.toLocaleString()}/{o.qty.toLocaleString()} ·{" "}
                            {date(o.createdAt)}
                          </div>
                        </div>
                        <Pill
                          tone={
                            o.status === "Executed"
                              ? "gain"
                              : o.status === "Cancelled" || o.status === "Expired"
                                ? "muted"
                                : "primary"
                          }
                        >
                          {o.status}
                        </Pill>
                      </div>
                      {(o.status === "Open" ||
                        o.status === "Partially Filled" ||
                        o.status === "Triggered") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1.5 h-6 text-[10px]"
                          disabled={pending}
                          onClick={() => run({ type: "cancelOrder", id: o.id }, "Order cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* 2.2 CRYPTO HOME SCREEN */}
      {tab === "crypto" && (
        <GameScrollContainer>
          {cryptoMenu === "market" ? (
            <>
              {s.level < UNLOCKS.crypto && (
                <Card className="mb-1.5 flex items-center gap-2 border-warn/40 py-1.5 px-2.5 text-xs">
                  <Lock className="h-3.5 w-3.5 text-warn shrink-0" />
                  <span>Unlocks at Level {UNLOCKS.crypto}.</span>
                </Card>
              )}

              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                  {(
                    [
                      { id: "growth" as const, label: "Gainers" },
                      { id: "dip" as const, label: "Losers" },
                      { id: "stables" as const, label: "Stable" },
                      { id: "volatility" as const, label: "Volatile" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setCryptoFilter(f.id);
                        setPage(1);
                      }}
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                        cryptoFilter === f.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground hidden sm:inline">
                  24/7 Live
                </span>
              </div>

              {(pagedRows as typeof rows.crypto).map((r) => (
                <div
                  key={r.c.symbol}
                  onClick={() => setSelectedAsset({ market: "crypto", sym: r.c.symbol })}
                  className="game-market-row flex cursor-pointer items-center justify-between gap-2 px-2.5 py-2"
                >
                  <span className="game-market-monogram">{r.c.symbol.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm">{r.c.symbol}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{r.c.name}</div>
                  </div>
                  <Sparkline
                    values={Array.from({ length: 18 }, (_, i) =>
                      cryptoPriceAtTick(r.c, cryptoTick(now) - (17 - i) * 40),
                    )}
                    up={r.ch >= 0}
                  />
                  <div className="shrink-0 text-right">
                    <div className="num text-xs sm:text-sm font-semibold">{price(r.p)}</div>
                    <div className={`num text-[11px] ${r.ch >= 0 ? "text-gain" : "text-loss"}`}>
                      {pct(r.ch, 2, true)}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="mt-2 mb-1 flex items-center justify-between border-t border-border/60 pt-2 px-1 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    Prev
                  </Button>
                  <div className="font-mono text-muted-foreground text-[11px]">
                    <span className="font-bold text-foreground">{currentPage}</span> / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              <Card className="border-primary/35 bg-card/90 p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Crypto Portfolio Value</div>
                    <div className="num text-sm font-bold text-foreground">
                      {money(cryptoTotalVal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Unrealized P/L</div>
                    <div
                      className={`num text-sm font-bold ${cryptoTotalPl >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {money(cryptoTotalPl, { sign: true })}
                    </div>
                  </div>
                </div>
              </Card>

              {cryptoHoldings.length === 0 ? (
                <Empty
                  title="No crypto owned"
                  text="Acquire digital tokens from the Crypto Market Listings."
                  action={
                    <Button size="sm" onClick={() => setCryptoMenu("market")}>
                      Browse Crypto Listings
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  {cryptoHoldings.map((h) => (
                    <Card
                      key={h.sym}
                      onClick={() => setSelectedAsset({ market: "crypto", sym: h.sym })}
                      className="flex cursor-pointer items-center justify-between p-2.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold">
                          <span>{h.sym}</span>
                          <span className="truncate text-[10px] font-normal text-muted-foreground">
                            {h.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {h.h.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })} units
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="num text-xs sm:text-sm font-semibold">{money(h.value)}</div>
                        <div className={`num text-[10px] ${h.pl >= 0 ? "text-gain" : "text-loss"}`}>
                          {money(h.pl, { sign: true })}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {cryptoOrders.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
                    <ListOrdered className="h-3.5 w-3.5" />
                    <span>Crypto Orders ({cryptoOrders.length})</span>
                  </div>
                  {cryptoOrders.map((o) => (
                    <Card key={o.id} className="p-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-xs">
                            {o.side.toUpperCase()} {o.sym}{" "}
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {o.kind}
                              {o.limit ? ` @ ${price(o.limit)}` : ""}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {o.filled.toLocaleString(undefined, { maximumFractionDigits: 4 })}/
                            {o.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} ·{" "}
                            {date(o.createdAt)}
                          </div>
                        </div>
                        <Pill
                          tone={
                            o.status === "Executed"
                              ? "gain"
                              : o.status === "Cancelled" || o.status === "Expired"
                                ? "muted"
                                : "primary"
                          }
                        >
                          {o.status}
                        </Pill>
                      </div>
                      {(o.status === "Open" ||
                        o.status === "Partially Filled" ||
                        o.status === "Triggered") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1.5 h-6 text-[10px]"
                          disabled={pending}
                          onClick={() => run({ type: "cancelOrder", id: o.id }, "Order cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* 2.3 ASSETS (COLLECTIBLES) HOME SCREEN */}
      {tab === "assets" && (
        <GameScrollContainer>
          {assetMenu === "market" &&
            (() => {
              const totalAssetPages = Math.max(1, Math.ceil(assetItems.length / assetPageSize));
              const curAssetPage = Math.min(assetPage, totalAssetPages);
              const pagedAssets = assetItems.slice(
                (curAssetPage - 1) * assetPageSize,
                curAssetPage * assetPageSize,
              );

              return (
                <div>
                  {/* Category Quick Chips */}
                  <div className="mb-1.5 flex gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setCat("all");
                        setAssetPage(1);
                      }}
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                        cat === "all"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCat(c.id);
                          setAssetPage(1);
                        }}
                        className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                          cat === c.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  {/* Single-Row Search + Rarity + Edition Filter */}
                  <div className="mb-2 grid grid-cols-3 gap-1.5">
                    <Input
                      placeholder="Search assets…"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setAssetPage(1);
                      }}
                      className="h-8 text-xs"
                    />
                    <CompactSelect
                      value={rarity}
                      onChange={(v) => {
                        setRarity(v);
                        setAssetPage(1);
                      }}
                      items={[
                        ["all", "All Rarities"],
                        ...RARITIES.map((r) => [r, r] as [string, string]),
                      ]}
                    />
                    <CompactSelect
                      value={edition}
                      onChange={(v) => {
                        setEdition(v);
                        setAssetPage(1);
                      }}
                      items={[
                        ["all", "All Editions"],
                        ["standard", "Standard"],
                        ["limited", "Limited"],
                      ]}
                    />
                  </div>

                  {/* 2-Column Compact Assets Grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {pagedAssets.map(({ it, ch, left, released }) => (
                      <Link key={it.id} to="/collectibles/$id" params={{ id: it.id }}>
                        <Card className="flex h-full items-center gap-2 p-2 hover:border-primary/50 transition-colors">
                          <CollectibleIcon
                            category={it.category}
                            rarity={it.rarity}
                            className="h-8 w-8 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate text-xs font-semibold">{it.name}</span>
                              {ownedSet.has(it.id) && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gain" />
                              )}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {it.rarity}
                              {it.limited
                                ? !released
                                  ? " · Upcoming"
                                  : left > 0
                                    ? ` · ${left} left`
                                    : " · Sold out"
                                : ""}
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-1">
                              <span className="num text-xs font-semibold">{money(it.price)}</span>
                              <span
                                className={`num text-[10px] ${ch >= 0 ? "text-gain" : "text-loss"}`}
                              >
                                {pct(ch, 1, true)}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {totalAssetPages > 1 && (
                    <div className="mt-2.5 mb-1 flex items-center justify-between border-t border-border/60 pt-2 px-1 text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={curAssetPage <= 1}
                        onClick={() => setAssetPage((p) => Math.max(1, p - 1))}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Prev
                      </Button>
                      <div className="font-mono text-muted-foreground text-[11px]">
                        <span className="font-bold text-foreground">{curAssetPage}</span> /{" "}
                        {totalAssetPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={curAssetPage >= totalAssetPages}
                        onClick={() => setAssetPage((p) => Math.min(totalAssetPages, p + 1))}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}

          {assetMenu === "portfolio" && (
            <div className="space-y-2.5">
              <Card className="border-primary/35 bg-card/90 p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Owned Assets Valuation</div>
                    <div className="num text-sm font-bold text-foreground">
                      {money(assetsTotalValue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Unrealized P/L</div>
                    <div
                      className={`num text-sm font-bold ${assetsTotalPl >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {money(assetsTotalPl, { sign: true })}
                    </div>
                  </div>
                </div>
              </Card>

              {inv.length === 0 ? (
                <Empty
                  title="No assets owned"
                  text="Acquire luxury collectibles from the Assets Market Listings."
                  action={
                    <Button size="sm" onClick={() => setAssetMenu("market")}>
                      Browse Market Listings
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  {inv.map((o) => {
                    const it = COLLECTIBLE_BY_ID[o.itemId]!;
                    const v = currentValue(it, now);
                    return (
                      <Link key={o.inst} to="/collectibles/$id" params={{ id: it.id }}>
                        <Card className="mb-1.5 flex items-center gap-2.5 p-2.5 hover:border-primary/40 transition-colors">
                          <CollectibleIcon
                            category={it.category}
                            rarity={it.rarity}
                            className="h-10 w-10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs sm:text-sm font-semibold">
                              {it.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Paid {money(o.price)} ·{" "}
                              {now < o.holdUntil
                                ? `Hold ${duration(o.holdUntil - now)}`
                                : it.restrictedResale
                                  ? "Restricted"
                                  : "Sellable"}
                            </div>
                          </div>
                          <div
                            className={`num text-xs sm:text-sm font-semibold ${v >= o.price ? "text-gain" : "text-loss"}`}
                          >
                            {money(v)}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {assetMenu === "collections" && (
            <div className="space-y-2">
              {COLLECTIONS.map((col) => {
                const have = col.items.filter((i) => ownedSet.has(i)).length;
                const done = have === col.items.length;
                return (
                  <Card key={col.id} className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold">{col.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Reward {money(col.reward.cash)} · +{pct(col.bonus.value)}{" "}
                          {col.bonus.key.replace("Pct", "")}
                        </div>
                      </div>
                      <Pill tone={done ? "gain" : "muted"}>
                        {done ? "Active" : `${have}/${col.items.length}`}
                      </Pill>
                    </div>
                    <Progress value={have / col.items.length} className="mt-1.5" />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {col.items.map((i) => (
                        <Link key={i} to="/collectibles/$id" params={{ id: i }}>
                          <Pill tone={ownedSet.has(i) ? "gain" : "muted"}>
                            {COLLECTIBLE_BY_ID[i]?.name}
                          </Pill>
                        </Link>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* Asset Inspect Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={(o) => !o && setSelectedAsset(null)}>
        <DialogContent className="max-w-lg bg-card border-primary/45 p-4 max-h-[85vh] overflow-y-auto">
          {selectedAsset && (
            <AssetInspectView
              market={selectedAsset.market}
              sym={selectedAsset.sym}
              onClose={() => setSelectedAsset(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompactSelect({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map(([v, l]) => (
          <SelectItem key={v} value={v} className="text-xs">
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  const low = Math.min(...values),
    high = Math.max(...values);
  const points = values
    .map(
      (v, i) =>
        `${(i * 58) / Math.max(1, values.length - 1)},${24 - ((v - low) / (high - low || 1)) * 22}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 58 26"
      aria-hidden="true"
      className={`game-sparkline ${up ? "text-gain" : "text-loss"}`}
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
