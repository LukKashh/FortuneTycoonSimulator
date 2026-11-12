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
      { title: "Trade-HUB — Stocks, Crypto & Assets · Capitalfortune" },
      { name: "description", content: "Trade stocks, crypto, and luxury collectible assets." },
      { property: "og:title", content: "Trade-HUB — Stocks, Crypto & Assets · Capitalfortune" },
      {
        property: "og:description",
        content: "Trade stocks, crypto, and luxury collectible assets.",
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
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [pf, setPf] = useState<HubTab>("stocks");
  const [portfolioTab, setPortfolioTab] = useState<"holdings" | "orders">("holdings");

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
  const [assetTab, setAssetTab] = useState<"market" | "inventory" | "collections">("market");
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

  const holdings = [
    ...Object.entries(s.stocks.holdings).map(([sym, h]) => {
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
    }),
    ...Object.entries(s.crypto.holdings).map(([sym, h]) => {
      const d = cr.map[sym];
      const p = d ? cryptoPriceAtTick(d, cryptoTick(now)) : 0;
      return {
        market: "crypto" as const,
        sym,
        name: d?.name ?? sym,
        h,
        value: h.qty * p,
        pl: h.qty * p - h.cost,
        dy: 0,
        divDay: 0,
      };
    }),
  ];

  const assetsTotalValue = inv.reduce((acc, o) => {
    const it = COLLECTIBLE_BY_ID[o.itemId];
    return acc + (it ? currentValue(it, now) : o.price);
  }, 0);
  const shown = holdings.filter((h) => h.market === (pf === "stocks" ? "stock" : "crypto"));
  const sum = (a: typeof holdings) => a.reduce((t, h) => t + h.value, 0);
  const walletTotal = sum(holdings) + assetsTotalValue;
  const typeTotal = pf === "assets" ? assetsTotalValue : sum(shown);
  const typePl =
    pf === "assets"
      ? inv.reduce((acc, o) => {
          const it = COLLECTIBLE_BY_ID[o.itemId];
          return acc + ((it ? currentValue(it, now) : o.price) - o.price);
        }, 0)
      : shown.reduce((t, h) => t + h.pl, 0);
  const divDay = shown.reduce((t, h) => t + h.divDay, 0);

  const activeRows = tab === "stocks" ? rows.stocks : rows.crypto;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top Bar: 3-Way Domain Switcher (Stocks | Crypto | Assets) + Compact Portfolio Button */}
      <div className="shrink-0 space-y-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl border border-border/80 bg-card/85 p-1">
            {(
              [
                { id: "stocks", label: "Stocks", icon: LineChart },
                { id: "crypto", label: "Crypto", icon: LineChart },
                { id: "assets", label: "Assets", icon: Gem },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setPage(1);
                }}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 text-xs font-bold transition ${
                  tab === item.id
                    ? "bg-gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant={showPortfolio ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPortfolio(!showPortfolio)}
            className="h-9 shrink-0 gap-1.5 rounded-xl border-primary/40 bg-card/85 px-2.5 text-xs font-semibold"
          >
            <Wallet className="h-3.5 w-3.5 text-gold" />
            <span>Portfolio</span>
          </Button>
        </div>

        {/* Stocks & Crypto Header Filters */}
        {tab !== "assets" && (
          <>
            {s.level < (tab === "stocks" ? UNLOCKS.stocks : UNLOCKS.crypto) && (
              <Card className="flex items-center gap-2 border-warn/40 py-1.5 px-2.5 text-xs">
                <Lock className="h-3.5 w-3.5 text-warn shrink-0" />
                <span>Unlocks at Level {tab === "stocks" ? UNLOCKS.stocks : UNLOCKS.crypto}.</span>
              </Card>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                {(tab === "stocks"
                  ? [
                      { id: "growth" as const, label: "Gainers" },
                      { id: "dip" as const, label: "Losers" },
                      { id: "dividends" as const, label: "Dividends" },
                      { id: "marketCapDesc" as const, label: "Large Cap" },
                      { id: "marketCapAsc" as const, label: "Small Cap" },
                    ]
                  : [
                      { id: "growth" as const, label: "Gainers" },
                      { id: "dip" as const, label: "Losers" },
                      { id: "stables" as const, label: "Stable" },
                      { id: "volatility" as const, label: "Volatile" },
                    ]
                ).map((f) => {
                  const isActive = tab === "stocks" ? stockFilter === f.id : cryptoFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        if (tab === "stocks") setStockFilter(f.id as StockFilter);
                        else setCryptoFilter(f.id as CryptoFilter);
                        setPage(1);
                      }}
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground hidden sm:inline">
                {tab === "stocks"
                  ? `IPO: ${upcoming.name} (${duration(upcoming.at - now)})`
                  : "24/7 Live"}
              </span>
            </div>
          </>
        )}

        {/* Assets (Collectibles) Sub-Navigation */}
        {tab === "assets" && (
          <Segmented
            value={assetTab}
            onChange={setAssetTab}
            options={[
              { id: "market", label: "Marketplace" },
              { id: "inventory", label: `Owned (${inv.length})` },
              { id: "collections", label: "Sets" },
            ]}
          />
        )}
      </div>

      {/* STOCKS & CRYPTO LISTINGS */}
      {tab !== "assets" && (
        <GameScrollContainer>
          {tab === "stocks"
            ? (pagedRows as typeof rows.stocks).map((r) => (
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
              ))
            : (pagedRows as typeof rows.crypto).map((r) => (
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
        </GameScrollContainer>
      )}

      {/* ASSETS (COLLECTIBLES) VIEW */}
      {tab === "assets" && (
        <GameScrollContainer>
          {assetTab === "market" &&
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

          {assetTab === "inventory" &&
            (inv.length === 0 ? (
              <Empty
                title="No assets owned"
                text="Acquire luxury collectibles from the marketplace."
                action={
                  <Button size="sm" onClick={() => setAssetTab("market")}>
                    Browse Assets
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
                          <div className="truncate text-xs sm:text-sm font-semibold">{it.name}</div>
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
            ))}

          {assetTab === "collections" && (
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

      {/* Unified Private Portfolio & Orders Modal */}
      <Dialog open={showPortfolio} onOpenChange={setShowPortfolio}>
        <DialogContent className="max-w-md bg-card border-primary/45 p-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center justify-between pr-4">
              <span>Portfolio &amp; Orders</span>
              <span className="num text-xs font-bold text-gain">{money(walletTotal)}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={portfolioTab === "holdings" ? "secondary" : "ghost"}
                  onClick={() => setPortfolioTab("holdings")}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Holdings ({holdings.length + inv.length})
                </Button>
                <Button
                  size="sm"
                  variant={portfolioTab === "orders" ? "secondary" : "ghost"}
                  onClick={() => setPortfolioTab("orders")}
                  className="h-7 text-xs font-semibold px-2.5 gap-1"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  Orders ({s.orders.length})
                </Button>
              </div>
            </div>

            {portfolioTab === "holdings" ? (
              <div>
                <Segmented
                  value={pf}
                  onChange={setPf}
                  options={[
                    { id: "stocks", label: "Stocks" },
                    { id: "crypto", label: "Crypto" },
                    { id: "assets", label: `Assets (${inv.length})` },
                  ]}
                />
                <div className="my-2 flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-2 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Category Value</div>
                    <div className="num font-semibold">{money(typeTotal)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">
                      {pf === "stocks" ? `Div ${money(divDay)}/d · P/L` : "Unrealized P/L"}
                    </div>
                    <div className={`num font-semibold ${typePl >= 0 ? "text-gain" : "text-loss"}`}>
                      {money(typePl, { sign: true })}
                    </div>
                  </div>
                </div>

                {pf === "assets" ? (
                  inv.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No collectible assets owned.
                    </p>
                  ) : (
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {inv.map((o) => {
                        const it = COLLECTIBLE_BY_ID[o.itemId]!;
                        const v = currentValue(it, now);
                        return (
                          <Link
                            key={o.inst}
                            to="/collectibles/$id"
                            params={{ id: it.id }}
                            onClick={() => setShowPortfolio(false)}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 hover:bg-muted/40"
                          >
                            <span className="truncate text-xs font-semibold">{it.name}</span>
                            <span
                              className={`num text-xs font-semibold ${v >= o.price ? "text-gain" : "text-loss"}`}
                            >
                              {money(v)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )
                ) : shown.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No {pf} owned yet.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1.5 overflow-y-auto overscroll-contain pr-1">
                    {shown.map((h) => (
                      <div
                        key={h.market + h.sym}
                        onClick={() => {
                          setShowPortfolio(false);
                          setSelectedAsset({ market: h.market, sym: h.sym });
                        }}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-xs">{h.sym}</div>
                          <div className="truncate text-[10px] text-muted-foreground">
                            {h.h.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })} units
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="num text-xs font-semibold">{money(h.value)}</div>
                          <div
                            className={`num text-[10px] ${h.pl >= 0 ? "text-gain" : "text-loss"}`}
                          >
                            {money(h.pl, { sign: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto overscroll-contain pr-1 space-y-1.5">
                {s.orders.length === 0 ? (
                  <Empty title="No orders" text="Active and past orders appear here." />
                ) : (
                  s.orders.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs"
                    >
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
                          className="mt-1 h-6 text-[10px]"
                          disabled={pending}
                          onClick={() => run({ type: "cancelOrder", id: o.id }, "Order cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
