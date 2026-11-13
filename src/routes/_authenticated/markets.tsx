import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Gem,
  History,
  LineChart,
  Lock,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { cryptoNow, stocksNow, UNLOCKS } from "@/game/engine";
import { cryptoPriceAtTick, cryptoTick, stockPriceAtTick, stockTick } from "@/game/market";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  COLLECTIBLES,
  COLLECTIBLE_BY_ID,
  COLLECTIONS,
  GRADING_FEE_PCT,
  collectibleValue,
  resolveCollectibleId,
} from "@/game/collectibles";
import { date, duration, money, pct, price } from "@/lib/format";
import {
  Card,
  Empty,
  GameScrollContainer,
  Loading,
  Pill,
  Progress,
  Row,
  Segmented,
} from "@/components/game/ui";
import { CollectibleIcon, MarketLogo, RARITY_TONE } from "@/components/game/CollectibleIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetInspectView } from "@/components/game/AssetInspectView";
import type { Order } from "@/game/types";

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
type CryptoFilter = "rank" | "growth" | "dip" | "stables" | "volatility";

function MarketsRoutePage() {
  const search = Route.useSearch();
  return <TradeHubScreen initialTab={search.tab ?? "stocks"} />;
}

export function TradeHubScreen({ initialTab = "stocks" }: { initialTab?: HubTab }) {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 10_000);
  const { run, pending } = useAct();
  const [tab, setTab] = useState<HubTab>(initialTab);

  // Separate Menu Toggles for each domain
  const [stockMenu, setStockMenu] = useState<"market" | "portfolio">("market");
  const [cryptoMenu, setCryptoMenu] = useState<"market" | "portfolio">("market");
  const [assetMenu, setAssetMenu] = useState<"market" | "portfolio" | "grading" | "sets">("market");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Selected stock/crypto asset for modal inspection
  const [selectedAsset, setSelectedAsset] = useState<{
    market: "stock" | "crypto";
    sym: string;
  } | null>(null);

  // Order history modal + clicked order receipt detail modal
  const [historyMarket, setHistoryMarket] = useState<"stock" | "crypto" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Selected Collectible Category inside Assets -> Market
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Multi-item batch grading counts keyed by itemId
  const [gradeQtyByItem, setGradeQtyByItem] = useState<Record<string, number>>({});

  // Stock & Crypto filters + pagination
  const [stockFilter, setStockFilter] = useState<StockFilter>("growth");
  const [cryptoFilter, setCryptoFilter] = useState<CryptoFilter>("rank");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
    if (cryptoFilter === "rank") cryptoRows.sort((a, b) => b.c.base - a.c.base);
    else if (cryptoFilter === "growth") cryptoRows.sort((a, b) => b.ch - a.ch);
    else if (cryptoFilter === "dip") cryptoRows.sort((a, b) => a.ch - b.ch);
    else if (cryptoFilter === "stables")
      cryptoRows.sort((a, b) => (volMap[a.c.profile] ?? 99) - (volMap[b.c.profile] ?? 99));
    else if (cryptoFilter === "volatility")
      cryptoRows.sort((a, b) => (volMap[b.c.profile] ?? 0) - (volMap[a.c.profile] ?? 0));

    return { stocks: stockRows, crypto: cryptoRows };
  }, [now, st, cr, stockFilter, cryptoFilter]);

  const categoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    return COLLECTIBLES.filter((it) => it.category === selectedCategory).sort(
      (a, b) => a.price - b.price,
    );
  }, [selectedCategory]);

  const inv = useMemo(() => (data ? Object.values(data.state.collectibles) : []), [data]);

  // Group ungraded inventory items for Batch Grading Process
  const ungradedGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        itemId: string;
        name: string;
        category: string;
        basePrice: number;
        insts: string[];
      }
    > = {};
    for (const o of inv) {
      if (o.rarity && o.rarity !== "Ungraded") continue;
      const resolvedId = resolveCollectibleId(o.itemId);
      const it = COLLECTIBLE_BY_ID[resolvedId];
      if (!it) continue;
      if (!groups[resolvedId]) {
        groups[resolvedId] = {
          itemId: resolvedId,
          name: it.name,
          category: it.category,
          basePrice: it.baseValue,
          insts: [],
        };
      }
      groups[resolvedId]!.insts.push(o.inst);
    }
    return Object.values(groups).sort((a, b) => a.basePrice - b.basePrice);
  }, [inv]);

  if (!data) return <Loading />;
  const s = data.state;
  const ownedSet = new Set(inv.map((o) => o.itemId));

  const ungradedCount = ungradedGroups.reduce((sum, g) => sum + g.insts.length, 0);

  const selectedGradeInsts = ungradedGroups.flatMap((g) => {
    const count = Math.min(g.insts.length, Math.max(0, gradeQtyByItem[g.itemId] || 0));
    return g.insts.slice(0, count);
  });

  const gradingFeeTotal = selectedGradeInsts.reduce((sum, inst) => {
    const o = s.collectibles[inst];
    const it = o ? COLLECTIBLE_BY_ID[resolveCollectibleId(o.itemId)] : null;
    return sum + (it ? it.baseValue * GRADING_FEE_PCT : 0);
  }, 0);

  const stockHoldings = Object.entries(s.stocks.holdings).map(([sym, h]) => {
    const d = st.map[sym];
    const p = d ? stockPriceAtTick(d, stockTick(now)) : 0;
    const dy = d && d.dividendYield > 0 ? d.dividendYield : 0;
    return {
      market: "stock" as const,
      sym,
      name: d?.name ?? sym,
      sector: d?.sector ?? "Technology",
      h,
      value: h.qty * p,
      pl: h.qty * p - h.cost,
      dy,
      divHour: (h.qty * p * dy) / (365 * 24),
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
  const stocksDivHour = stockHoldings.reduce((t, h) => t + h.divHour, 0);
  const uncollectedDivs = s.stocks.uncollectedDividends || 0;
  const stockOrders = s.orders.filter((o) => o.market === "stock");

  const cryptoTotalVal = cryptoHoldings.reduce((t, h) => t + h.value, 0);
  const cryptoTotalPl = cryptoHoldings.reduce((t, h) => t + h.pl, 0);
  const cryptoOrders = s.orders.filter((o) => o.market === "crypto");

  const assetsTotalValue = inv.reduce((acc, o) => {
    const it = COLLECTIBLE_BY_ID[resolveCollectibleId(o.itemId)];
    return acc + collectibleValue(it, o.rarity, o.price);
  }, 0);
  const assetsTotalPl = inv.reduce((acc, o) => {
    const it = COLLECTIBLE_BY_ID[resolveCollectibleId(o.itemId)];
    return acc + (collectibleValue(it, o.rarity, o.price) - o.price);
  }, 0);

  const activeRows = tab === "stocks" ? rows.stocks : rows.crypto;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeHistoryOrders =
    historyMarket === "stock" ? stockOrders : historyMarket === "crypto" ? cryptoOrders : [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Asset Management Gateway Selector */}
      <div className="mb-1.5 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-sm font-extrabold tracking-tight text-foreground">
            Asset Management
          </h1>
          <span className="text-[10px] font-medium text-muted-foreground">
            {tab === "stocks"
              ? "Equities & Hourly Dividends"
              : tab === "crypto"
                ? "24/7 Digital Tokens"
                : "Luxury Assets & Grading"}
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
              className={`flex flex-col items-center justify-center rounded-lg px-2 py-1.5 transition ${
                tab === item.id
                  ? "bg-gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </div>
              <span
                className={`font-mono text-[9px] whitespace-nowrap ${
                  tab === item.id ? "text-primary-foreground/85" : "text-muted-foreground"
                }`}
              >
                {item.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Stock Menu Toggle */}
        {tab === "stocks" && (
          <Segmented
            value={stockMenu}
            onChange={setStockMenu}
            options={[
              { id: "market", label: "Stock Exchange" },
              {
                id: "portfolio",
                label: `💰 My Portfolio (${stockHoldings.length})`,
              },
            ]}
          />
        )}

        {/* Crypto Menu Toggle */}
        {tab === "crypto" && (
          <Segmented
            value={cryptoMenu}
            onChange={setCryptoMenu}
            options={[
              { id: "market", label: "CryptoTrade Exchange" },
              {
                id: "portfolio",
                label: `E-Wallet (${cryptoHoldings.length})`,
              },
            ]}
          />
        )}

        {/* Assets Menu Toggle */}
        {tab === "assets" && (
          <Segmented
            value={assetMenu}
            onChange={setAssetMenu}
            options={[
              { id: "market", label: "Market" },
              { id: "portfolio", label: `Inventory (${inv.length})` },
              { id: "grading", label: `Grading (${ungradedCount})` },
              { id: "sets", label: "Sets" },
            ]}
          />
        )}
      </div>

      {/* 1. STOCKS VIEW */}
      {tab === "stocks" && (
        <GameScrollContainer>
          {stockMenu === "market" ? (
            <>
              {s.level < UNLOCKS.stocks && (
                <Card className="mb-1.5 flex items-center gap-2 border-warn/40 px-2.5 py-1.5 text-xs">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-warn" />
                  <span>Unlocks at Level {UNLOCKS.stocks}.</span>
                </Card>
              )}

              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto pb-0.5 text-xs">
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
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium whitespace-nowrap transition ${
                        stockFilter === f.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">
                  {rows.stocks.length} Listed
                </span>
              </div>

              {(pagedRows as typeof rows.stocks).map((r) => (
                <div
                  key={r.s.ticker}
                  onClick={() => setSelectedAsset({ market: "stock", sym: r.s.ticker })}
                  className="game-market-row flex cursor-pointer items-center justify-between gap-2.5 px-2.5 py-2"
                >
                  <MarketLogo
                    market="stock"
                    symbol={r.s.ticker}
                    sector={r.s.sector}
                    className="h-9 w-9"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold sm:text-sm">{r.s.ticker}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {r.s.name} · {r.s.sector}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-xs font-semibold sm:text-sm">{price(r.p)}</div>
                    <div className={`num text-[11px] ${r.ch >= 0 ? "text-gain" : "text-loss"}`}>
                      {pct(r.ch, 2, true)}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="mb-1 mt-2 flex items-center justify-between border-t border-border/60 px-1 pt-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    Prev
                  </Button>
                  <div className="font-mono text-[11px] text-muted-foreground">
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
            <div className="space-y-3">
              {/* Portfolio Statistics Panel (Separated from Inventory) */}
              <Card className="space-y-2.5 border-primary/35 bg-card/90 p-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                    💰 Portfolio Overview
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-[11px] whitespace-nowrap"
                    onClick={() => setHistoryMarket("stock")}
                  >
                    <History className="h-3 w-3" />
                    Order History ({stockOrders.length})
                  </Button>
                </div>

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
                    <div className="text-[10px] text-muted-foreground">Dividends /hr</div>
                    <div className="num text-sm font-bold text-gain">{money(stocksDivHour)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/55 px-2.5 py-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Accumulated Dividends
                    </div>
                    <div className="num text-sm font-bold text-gain">{money(uncollectedDivs)}</div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 bg-gradient-primary px-3 text-xs font-semibold whitespace-nowrap"
                    disabled={pending || uncollectedDivs <= 0}
                    onClick={() => run({ type: "collectDividends" }, "Dividends collected")}
                  >
                    Collect Dividends
                  </Button>
                </div>
              </Card>

              {/* Owned Inventory */}
              <div className="space-y-1.5">
                <div className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Owned Equities ({stockHoldings.length})
                </div>
                {stockHoldings.length === 0 ? (
                  <Empty
                    title="No stocks owned"
                    text="Buy shares from the Stock Exchange to build your equity portfolio."
                    action={
                      <Button size="sm" onClick={() => setStockMenu("market")}>
                        Browse Stock Exchange
                      </Button>
                    }
                  />
                ) : (
                  stockHoldings.map((h) => (
                    <Card
                      key={h.sym}
                      onClick={() => setSelectedAsset({ market: "stock", sym: h.sym })}
                      className="flex cursor-pointer items-center justify-between gap-2.5 p-2.5 transition-colors hover:border-primary/40"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <MarketLogo
                          market="stock"
                          symbol={h.sym}
                          sector={h.sector}
                          className="h-9 w-9"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
                            <span>{h.sym}</span>
                            <span className="truncate text-[10px] font-normal text-muted-foreground">
                              {h.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {h.h.qty.toLocaleString()} shares · Div {money(h.divHour)}/hr
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="num text-xs font-semibold sm:text-sm">{money(h.value)}</div>
                        <div className={`num text-[10px] ${h.pl >= 0 ? "text-gain" : "text-loss"}`}>
                          {money(h.pl, { sign: true })}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* 2. CRYPTO VIEW */}
      {tab === "crypto" && (
        <GameScrollContainer>
          {cryptoMenu === "market" ? (
            <>
              {s.level < UNLOCKS.crypto && (
                <Card className="mb-1.5 flex items-center gap-2 border-warn/40 px-2.5 py-1.5 text-xs">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-warn" />
                  <span>Unlocks at Level {UNLOCKS.crypto}.</span>
                </Card>
              )}

              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto pb-0.5 text-xs">
                  {(
                    [
                      { id: "rank" as const, label: "Ranked" },
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
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium whitespace-nowrap transition ${
                        cryptoFilter === f.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">
                  {rows.crypto.length} Coins · 24/7
                </span>
              </div>

              {(pagedRows as typeof rows.crypto).map((r) => (
                <div
                  key={r.c.symbol}
                  onClick={() => setSelectedAsset({ market: "crypto", sym: r.c.symbol })}
                  className="game-market-row flex cursor-pointer items-center justify-between gap-2.5 px-2.5 py-2"
                >
                  <MarketLogo market="crypto" symbol={r.c.symbol} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold sm:text-sm">{r.c.symbol}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{r.c.name}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-xs font-semibold sm:text-sm">{price(r.p)}</div>
                    <div className={`num text-[11px] ${r.ch >= 0 ? "text-gain" : "text-loss"}`}>
                      {pct(r.ch, 2, true)}
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="mb-1 mt-2 flex items-center justify-between border-t border-border/60 px-1 pt-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 gap-1 px-2.5 text-xs"
                  >
                    Prev
                  </Button>
                  <div className="font-mono text-[11px] text-muted-foreground">
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
            <div className="space-y-3">
              {/* E-Wallet Statistics Card (Matching My Portfolio layout) */}
              <Card className="space-y-2.5 border-primary/35 bg-card/90 p-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                    E-Wallet Overview
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-[11px] whitespace-nowrap"
                    onClick={() => setHistoryMarket("crypto")}
                  >
                    <History className="h-3 w-3" />
                    Order History ({cryptoOrders.length})
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">E-Wallet Value</div>
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

              {/* Owned Tokens Inventory */}
              <div className="space-y-1.5">
                <div className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Owned Tokens ({cryptoHoldings.length})
                </div>
                {cryptoHoldings.length === 0 ? (
                  <Empty
                    title="No crypto owned"
                    text="Acquire digital tokens from the CryptoTrade Exchange."
                    action={
                      <Button size="sm" onClick={() => setCryptoMenu("market")}>
                        Browse CryptoTrade Exchange
                      </Button>
                    }
                  />
                ) : (
                  cryptoHoldings.map((h) => (
                    <Card
                      key={h.sym}
                      onClick={() => setSelectedAsset({ market: "crypto", sym: h.sym })}
                      className="flex cursor-pointer items-center justify-between gap-2.5 p-2.5 transition-colors hover:border-primary/40"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <MarketLogo market="crypto" symbol={h.sym} className="h-9 w-9" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
                            <span>{h.sym}</span>
                            <span className="truncate text-[10px] font-normal text-muted-foreground">
                              {h.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {h.h.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })} units
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="num text-xs font-semibold sm:text-sm">{money(h.value)}</div>
                        <div className={`num text-[10px] ${h.pl >= 0 ? "text-gain" : "text-loss"}`}>
                          {money(h.pl, { sign: true })}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* 3. ASSETS (COLLECTIBLES) VIEW */}
      {tab === "assets" && (
        <GameScrollContainer>
          {assetMenu === "market" && (
            <div>
              {!selectedCategory ? (
                <div className="space-y-2">
                  <div className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Asset Category (9 Categories · 120 Fixed Assets)
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CATEGORIES.map((c) => {
                      const count = COLLECTIBLES.filter((x) => x.category === c.id).length;
                      return (
                        <Card
                          key={c.id}
                          onClick={() => setSelectedCategory(c.id)}
                          className="flex cursor-pointer items-center gap-2.5 p-2.5 transition-colors hover:border-primary/50"
                        >
                          <CollectibleIcon
                            category={c.id}
                            rarity="Ungraded"
                            className="h-10 w-10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-foreground">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {count} items · From {money(c.base)}
                            </div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      All Categories
                    </Button>
                    <span className="text-xs font-bold text-foreground">
                      {CATEGORY_BY_ID[selectedCategory]?.name} ({categoryItems.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {categoryItems.map((it) => (
                      <Link key={it.id} to="/collectibles/$id" params={{ id: it.id }}>
                        <Card className="flex h-full items-center gap-2 p-2.5 transition-colors hover:border-primary/50">
                          <CollectibleIcon
                            category={it.category}
                            itemId={it.id}
                            rarity="Ungraded"
                            className="h-9 w-9 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-foreground">
                              {it.name}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {it.sub}
                            </div>
                            <div className="num mt-0.5 text-xs font-bold text-foreground">
                              {money(it.price)}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {assetMenu === "portfolio" && (
            <div className="space-y-2.5">
              <Card className="border-primary/35 bg-card/90 p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Owned Assets Valuation</div>
                    <div className="num text-sm font-bold text-foreground">
                      {money(assetsTotalValue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Grading Gain / Loss</div>
                    <div
                      className={`num text-sm font-bold ${assetsTotalPl >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {money(assetsTotalPl, { sign: true })}
                    </div>
                  </div>
                </div>
                {ungradedCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2.5 h-8 w-full gap-1.5 text-xs"
                    onClick={() => setAssetMenu("grading")}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Grade {ungradedCount} Ungraded Asset{ungradedCount === 1 ? "" : "s"}
                  </Button>
                )}
              </Card>

              {inv.length === 0 ? (
                <Empty
                  title="No assets owned"
                  text="Acquire luxury assets from the Market categories."
                  action={
                    <Button size="sm" onClick={() => setAssetMenu("market")}>
                      Browse Asset Categories
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  {inv.map((o) => {
                    const it = COLLECTIBLE_BY_ID[resolveCollectibleId(o.itemId)];
                    if (!it) return null;
                    const grade = o.rarity ?? "Ungraded";
                    const v = collectibleValue(it, grade, o.price);
                    return (
                      <Link key={o.inst} to="/collectibles/$id" params={{ id: it.id }}>
                        <Card className="mb-1.5 flex items-center gap-2.5 p-2.5 transition-colors hover:border-primary/40">
                          <CollectibleIcon
                            category={it.category}
                            itemId={it.id}
                            rarity={grade}
                            className="h-10 w-10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-semibold sm:text-sm">
                                {it.name}
                              </span>
                              <span
                                className={`shrink-0 rounded border px-1.5 py-0.2 text-[9px] font-semibold ${RARITY_TONE[grade]}`}
                              >
                                {grade === "Ungraded" ? "Ungraded Rarity" : grade}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Paid {money(o.price)} ·{" "}
                              {now < o.holdUntil
                                ? `Hold ${duration(o.holdUntil - now)}`
                                : "Sellable"}
                            </div>
                          </div>
                          <div
                            className={`num shrink-0 text-xs font-semibold sm:text-sm ${
                              v > o.price ? "text-gain" : "text-foreground"
                            }`}
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

          {assetMenu === "grading" && (
            <div className="space-y-3">
              <Card className="space-y-2 border-primary/35 bg-card/90 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Batch Grading Process
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Reveal each ungraded unit&apos;s rarity individually (1-to-1) for a{" "}
                      <span className="font-semibold text-foreground">7.5%</span> grading fee.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[11px] whitespace-nowrap"
                    disabled={ungradedCount === 0}
                    onClick={() => {
                      const next: Record<string, number> = {};
                      for (const g of ungradedGroups) next[g.itemId] = g.insts.length;
                      setGradeQtyByItem(next);
                    }}
                  >
                    Select All ({ungradedCount})
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-2.5 py-2 text-xs">
                  <span>
                    Selected:{" "}
                    <span className="num font-bold text-foreground">
                      {selectedGradeInsts.length}
                    </span>{" "}
                    unit{selectedGradeInsts.length === 1 ? "" : "s"}
                  </span>
                  <span>
                    Total Fee (7.5%):{" "}
                    <span className="num font-bold text-primary">{money(gradingFeeTotal)}</span>
                  </span>
                </div>

                <Button
                  size="sm"
                  className="h-9 w-full bg-gradient-primary text-xs font-semibold"
                  disabled={pending || selectedGradeInsts.length === 0 || s.cash < gradingFeeTotal}
                  onClick={() =>
                    run(
                      { type: "gradeCollectibles", insts: selectedGradeInsts },
                      "Assets graded!",
                    ).then(() => setGradeQtyByItem({}))
                  }
                >
                  {s.cash < gradingFeeTotal && selectedGradeInsts.length > 0
                    ? `Need ${money(gradingFeeTotal)} Cash`
                    : `Start Grading (${selectedGradeInsts.length} · ${money(gradingFeeTotal)})`}
                </Button>
              </Card>

              {ungradedGroups.length === 0 ? (
                <Empty
                  title="No ungraded assets"
                  text="Purchase assets from the Market to grade them here and unlock rarity bonuses."
                  action={
                    <Button size="sm" onClick={() => setAssetMenu("market")}>
                      Browse Asset Market
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  {ungradedGroups.map((g) => {
                    const count = Math.min(
                      g.insts.length,
                      Math.max(0, gradeQtyByItem[g.itemId] || 0),
                    );
                    const feePerUnit = g.basePrice * GRADING_FEE_PCT;
                    return (
                      <Card
                        key={g.itemId}
                        className="flex items-center justify-between gap-2 p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CollectibleIcon
                            category={g.category}
                            itemId={g.itemId}
                            rarity="Ungraded"
                            className="h-9 w-9 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold">{g.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {g.insts.length} ungraded · Fee {money(feePerUnit)}/ea
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-xs"
                            disabled={count <= 0}
                            onClick={() =>
                              setGradeQtyByItem((prev) => ({
                                ...prev,
                                [g.itemId]: Math.max(0, count - 1),
                              }))
                            }
                          >
                            -
                          </Button>
                          <span className="num w-8 text-center text-xs font-bold">
                            {count}/{g.insts.length}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-xs"
                            disabled={count >= g.insts.length}
                            onClick={() =>
                              setGradeQtyByItem((prev) => ({
                                ...prev,
                                [g.itemId]: Math.min(g.insts.length, count + 1),
                              }))
                            }
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-1.5 text-[10px]"
                            onClick={() =>
                              setGradeQtyByItem((prev) => ({
                                ...prev,
                                [g.itemId]: count === g.insts.length ? 0 : g.insts.length,
                              }))
                            }
                          >
                            {count === g.insts.length ? "None" : "All"}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {s.lastGradingReport && (
                <Card className="space-y-2 border-gain/40 bg-card/90 p-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <div className="text-xs font-bold text-gain">Latest Grading Results</div>
                    <span className="text-[10px] text-muted-foreground">
                      {s.lastGradingReport.totalUnits} units · Fee {money(s.lastGradingReport.fee)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(s.lastGradingReport.byItem).map(([id, entry]) => (
                      <div key={id} className="rounded-lg border border-border/50 p-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span>{entry.name}</span>
                          <span className="num text-[11px] text-muted-foreground">
                            ×{entry.total}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(entry.counts).map(([rarityName, qty]) => (
                            <Pill key={rarityName} tone="primary">
                              {qty} {rarityName}
                            </Pill>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {assetMenu === "sets" && (
            <div className="space-y-2">
              {COLLECTIONS.map((col) => {
                const have = col.items.filter((i) => ownedSet.has(i)).length;
                const done = have === col.items.length;
                return (
                  <Card key={col.id} className="p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold sm:text-sm">{col.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Reward {money(col.reward.cash)} · +{pct(col.bonus.value)}{" "}
                          {col.bonus.key.replace("Pct", "")}
                        </div>
                      </div>
                      <Pill tone={done ? "gain" : "muted"}>
                        {have}/{col.items.length}
                      </Pill>
                    </div>
                    <Progress value={have / col.items.length} className="mt-2 h-1.5" />
                  </Card>
                );
              })}
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* Inspect Stock or Crypto Transaction Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-border/80 bg-card/95 p-3.5 backdrop-blur-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <AssetInspectView
              market={selectedAsset.market}
              sym={selectedAsset.sym}
              onClose={() => setSelectedAsset(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Order History Modal */}
      <Dialog open={!!historyMarket} onOpenChange={(open) => !open && setHistoryMarket(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto border-border/80 bg-card/95 p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {historyMarket === "stock" ? "Stock Order History" : "Crypto Order History"}
            </DialogTitle>
          </DialogHeader>
          {activeHistoryOrders.length === 0 ? (
            <Empty
              title="No transactions yet"
              text="Executed and open orders for this market will appear here."
            />
          ) : (
            <div className="space-y-1.5">
              {activeHistoryOrders.map((o) => (
                <Card
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="cursor-pointer p-2.5 text-xs transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold">
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
                    <div className="flex shrink-0 items-center gap-1.5">
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
                      <ChevronLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
                    </div>
                  </div>
                  {(o.status === "Open" ||
                    o.status === "Partially Filled" ||
                    o.status === "Triggered") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-6 text-[10px]"
                      disabled={pending}
                      onClick={(e) => {
                        e.stopPropagation();
                        void run({ type: "cancelOrder", id: o.id }, "Order cancelled");
                      }}
                    >
                      Cancel Order
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Specific Order Transaction Receipt Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-sm border-border/80 bg-card/95 p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedOrder &&
            (() => {
              const o = selectedOrder;
              const defName =
                o.market === "stock"
                  ? (st.map[o.sym]?.name ?? o.sym)
                  : (cr.map[o.sym]?.name ?? o.sym);
              const gross = o.filled * o.avgPrice;
              const totalSettlement = o.side === "buy" ? gross + o.fees : gross - o.fees;
              return (
                <div className="space-y-1 text-xs">
                  <Row label="Purchased / Sold Asset" value={`${o.sym} · ${defName}`} />
                  <Row label="Order Type" value={`${o.side.toUpperCase()} (${o.kind})`} />
                  <Row label="Status" value={o.status} />
                  <Row
                    label="Amount"
                    value={`${o.filled.toLocaleString(undefined, { maximumFractionDigits: 6 })} / ${o.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
                  />
                  <Row
                    label="Avg Execution Price"
                    value={o.avgPrice > 0 ? price(o.avgPrice) : "Pending"}
                  />
                  <Row label="Fee Amount" value={money(o.fees)} />
                  <Row
                    label={o.side === "buy" ? "Total Cost" : "Total Proceeds"}
                    value={o.filled > 0 ? money(totalSettlement) : "—"}
                    tone={o.side === "sell" && o.filled > 0 ? "gain" : undefined}
                  />
                  <Row label="Executed / Updated" value={date(o.updatedAt || o.createdAt)} />
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
