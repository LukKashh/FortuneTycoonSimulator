import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Home, Lock, Plus, Search } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { COMPANIES, PROPERTIES, type CompanyDef } from "@/game/config";
import {
  capacityUpgradeCost,
  companyEcon,
  companyValuation,
  conditionLabel,
  personalMods,
  propertyEcon,
  UNLOCKS,
} from "@/game/engine";
import { corpMods } from "@/game/corp";
import { money, pct } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameScrollContainer,
  Loading,
  Pill,
  Row,
  Segmented,
  Stat,
} from "@/components/game/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuildingSprite } from "@/components/game/BuildingSprite";
import { WALLET_REFRESH_MS, liveCompanyWallet, liveRentWallet } from "@/components/game/wallet";
import { OverviewPanel } from "@/components/game/OverviewPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/empire")({
  validateSearch: (s: Record<string, unknown>): { section?: "business" | "realestate" } => ({
    ...(s.section === "realestate"
      ? { section: "realestate" as const }
      : s.section === "business"
        ? { section: "business" as const }
        : {}),
  }),
  head: () => ({
    meta: [
      { title: "Empire Overview — Businesses & Real Estate · Capitalfortune" },
      { name: "description", content: "Manage companies and rental real estate." },
      {
        property: "og:title",
        content: "Empire Overview — Businesses & Real Estate · Capitalfortune",
      },
      { property: "og:description", content: "Manage companies and rental real estate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmpireRoutePage,
});

const statusTone = (s: string) =>
  (s === "Profitable"
    ? "gain"
    : s === "Break-even"
      ? "muted"
      : s === "Unprofitable"
        ? "warn"
        : "loss") as "gain" | "muted" | "warn" | "loss";

function EmpireRoutePage() {
  const search = Route.useSearch();
  return <EmpireScreen initialSection={search.section ?? "business"} />;
}

export function EmpireScreen({
  initialSection = "business",
}: {
  initialSection?: "business" | "realestate";
}) {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, WALLET_REFRESH_MS);
  const { run, pending } = useAct();

  const [section, setSection] = useState<"business" | "realestate">(initialSection);
  const [bizTab, setBizTab] = useState<"owned" | "report">("owned");
  const [bizMarketOpen, setBizMarketOpen] = useState(false);
  const [bizIndustry, setBizIndustry] = useState("All");
  const [bizQuery, setBizQuery] = useState("");
  const [bizPage, setBizPage] = useState(1);
  const bizPageSize = 10;

  const [reMarketOpen, setReMarketOpen] = useState(false);
  const [reCat, setReCat] = useState("All");
  const [reQuery, setReQuery] = useState("");
  const [rePage, setRePage] = useState(1);
  const rePageSize = 10;

  const [detail, setDetail] = useState<CompanyDef | null>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const p = useMemo(() => (data ? personalMods(data.state) : null), [data]);
  const cm = useMemo(() => (data ? corpMods(data.corp) : null), [data]);

  const bizIndustries = useMemo(() => ["All", ...new Set(COMPANIES.map((c) => c.industry))], []);

  const filteredBusinesses = useMemo(() => {
    const q = bizQuery.trim().toLowerCase();
    return [...COMPANIES]
      .filter(
        (d) =>
          (bizIndustry === "All" || d.industry === bizIndustry) &&
          (!q ||
            d.name.toLowerCase().includes(q) ||
            d.industry.toLowerCase().includes(q) ||
            d.model.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.price - b.price);
  }, [bizIndustry, bizQuery]);

  if (!data || !p || !cm) return <Loading />;
  const s = data.state;

  // Businesses data
  const ownedBiz = Object.values(s.companies);
  const econ = ownedBiz.map((o) => ({ o, e: companyEcon(o, p, cm, now) }));
  const totals = econ.reduce(
    (a, { o, e }) => ({
      rev: a.rev + e.revenue,
      exp: a.exp + e.expenses,
      val: a.val + companyValuation(o),
      unc: a.unc + liveCompanyWallet(o, e.net, s.lastTick, now),
      inv: a.inv + o.price + o.upgradeValue,
      life: a.life + o.revenueTotal - o.expenseTotal,
    }),
    { rev: 0, exp: 0, val: 0, unc: 0, inv: 0, life: 0 },
  );
  const capCost = capacityUpgradeCost(s.capacity.level);

  // Real Estate data
  const ownedProps = Object.values(s.properties);
  const propertyRows = ownedProps.map((pr) => ({ pr, e: propertyEcon(pr, p, cm, now) }));
  const reCats = ["All", ...new Set(PROPERTIES.map((x) => x.category))];
  const reLocked = s.level < UNLOCKS.realEstate;
  const rentNet = propertyRows.reduce((total, row) => total + row.e.net, 0);
  const rentWallet = propertyRows.reduce(
    (total, row) => total + liveRentWallet(row.pr, row.e.net, s.lastTick, now),
    0,
  );

  const filteredProperties = PROPERTIES.filter((x) => {
    const q = reQuery.trim().toLowerCase();
    return (
      (reCat === "All" || x.category === reCat) &&
      !ownedProps.some((o) => o.defId === x.id) &&
      (!q ||
        x.name.toLowerCase().includes(q) ||
        x.location.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q))
    );
  }).sort((a, b) => a.price - b.price);

  const totalBizPages = Math.max(1, Math.ceil(filteredBusinesses.length / bizPageSize));
  const curBizPage = Math.min(bizPage, totalBizPages);
  const pagedBusinesses = filteredBusinesses.slice(
    (curBizPage - 1) * bizPageSize,
    curBizPage * bizPageSize,
  );

  const totalRePages = Math.max(1, Math.ceil(filteredProperties.length / rePageSize));
  const curRePage = Math.min(rePage, totalRePages);
  const pagedProperties = filteredProperties.slice(
    (curRePage - 1) * rePageSize,
    curRePage * rePageSize,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Empire Overview Gateway Header */}
      <div className="shrink-0 space-y-1.5 mb-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-sm font-extrabold tracking-tight text-foreground">Empire Overview</h1>
          <span className="text-[10px] font-medium text-muted-foreground">
            {section === "business"
              ? `${COMPANIES.length} Available Business Models`
              : `${PROPERTIES.length} Global Real Estate Assets`}
          </span>
        </div>

        {/* Gateway Domain Switcher: Businesses vs Real Estate */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border/80 bg-card/85 p-1">
          <button
            type="button"
            onClick={() => setSection("business")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-bold transition ${
              section === "business"
                ? "bg-gradient-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Businesses</span>
            <span className="rounded bg-black/25 px-1.5 py-0.2 font-mono text-[10px]">
              {ownedBiz.length}/{s.capacity.slots}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSection("realestate")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-bold transition ${
              section === "realestate"
                ? "bg-gradient-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Real Estate</span>
            <span className="rounded bg-black/25 px-1.5 py-0.2 font-mono text-[10px]">
              {ownedProps.length}
            </span>
          </button>
        </div>

        {section === "business" && (
          <Segmented
            value={bizTab}
            onChange={setBizTab}
            options={[
              { id: "owned", label: `Owned Businesses (${ownedBiz.length})` },
              { id: "report", label: "Empire Metrics" },
            ]}
          />
        )}
      </div>

      {/* SECTION 1: BUSINESSES */}
      {section === "business" && (
        <GameScrollContainer className="space-y-2">
          {bizTab === "owned" && (
            <>
              {/* Compact Business Wallet, Instant Slot Expansion & New Facility Trigger */}
              <Card className="border-primary/35 bg-card/90 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Business Wallet ·{" "}
                      <span className={totals.rev >= totals.exp ? "text-gain" : "text-loss"}>
                        {money(totals.rev - totals.exp)}/h
                      </span>
                    </div>
                    <div className="num text-lg font-bold text-gain">{money(totals.unc)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Confirm
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-medium border-primary/30"
                          disabled={pending || s.cash < capCost}
                        >
                          +1 Slot · {money(capCost)}
                        </Button>
                      }
                      title="Expand company capacity?"
                      description={`Deducts ${money(capCost)} and immediately adds +1 business slot.`}
                      onConfirm={() => run({ type: "capacityUpgrade" }, "Business slot expanded")}
                    />
                    <Button
                      size="sm"
                      className="h-7 bg-gradient-primary px-2.5 text-xs font-semibold"
                      disabled={pending || totals.unc < 0.01}
                      onClick={() => run({ type: "collect" }, "Collected business profits")}
                    >
                      Collect
                    </Button>
                  </div>
                </div>

                {/* New Facility Button inside Owned Businesses Panel */}
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    Active Slots:{" "}
                    <b className="text-foreground font-mono">
                      {ownedBiz.length} / {s.capacity.slots}
                    </b>
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setBizMarketOpen(true)}
                    className="h-7 gap-1 bg-primary/90 hover:bg-primary px-3 text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Facility
                  </Button>
                </div>
              </Card>

              {ownedBiz.length === 0 ? (
                <Empty
                  icon={<Building2 className="h-6 w-6" />}
                  title="No businesses owned"
                  text="Press New Facility to open the Business Marketplace listings."
                  action={
                    <Button size="sm" onClick={() => setBizMarketOpen(true)} className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      New Facility
                    </Button>
                  }
                />
              ) : (
                econ.map(({ o, e }) => {
                  const d = COMPANIES.find((c) => c.id === o.defId)!;
                  return (
                    <Link key={o.inst} to="/empire/$inst" params={{ inst: o.inst }}>
                      <Card className="mb-2 flex items-center gap-3 p-2.5 hover:border-primary/40 transition-colors">
                        <BuildingSprite
                          businessDefId={d.id}
                          fit="cover"
                          className="game-art h-14 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">{d.name}</span>
                            <Pill tone={statusTone(e.status)}>{e.status}</Pill>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {d.industry} · {o.branches} br · {e.staff}/{e.need} staff
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span
                              className={`num font-semibold ${e.net >= 0 ? "text-gain" : "text-loss"}`}
                            >
                              {money(e.net)}/h net
                            </span>
                            <span className="num text-[11px] text-muted-foreground">
                              Wallet:{" "}
                              <b className="text-gain">
                                {money(liveCompanyWallet(o, e.net, s.lastTick, now))}
                              </b>
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              )}
            </>
          )}

          {bizTab === "report" && (
            <div className="space-y-2.5">
              <OverviewPanel />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label="Revenue /h" value={money(totals.rev)} />
                <Stat label="Expenses /h" value={money(totals.exp)} />
                <Stat
                  label="Net /h"
                  value={money(totals.rev - totals.exp)}
                  tone={totals.rev >= totals.exp ? "gain" : "loss"}
                />
                <Stat label="Valuation" value={money(totals.val)} />
                <Stat label="Invested" value={money(totals.inv)} />
                <Stat
                  label="ROI"
                  value={totals.inv ? `${((totals.life / totals.inv) * 100).toFixed(1)}%` : "—"}
                  tone={totals.life >= 0 ? "gain" : "loss"}
                />
              </div>
              {s.soldCompanies.length > 0 && (
                <Card>
                  <div className="mb-1 text-xs font-semibold">Sold Companies</div>
                  {s.soldCompanies.map((x, i) => (
                    <Row key={i} label={x.name} value={money(x.payout)} />
                  ))}
                </Card>
              )}
            </div>
          )}
        </GameScrollContainer>
      )}

      {/* SECTION 2: REAL ESTATE (Owned Real Estate Panel) */}
      {section === "realestate" && (
        <GameScrollContainer className="space-y-2">
          <Card className="border-primary/35 bg-card/90 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Rent Wallet ·{" "}
                  <span className={rentNet >= 0 ? "text-gain" : "text-loss"}>
                    {money(rentNet)}/h
                  </span>
                </div>
                <div className="num text-lg font-bold text-gain">{money(rentWallet)}</div>
              </div>
              <Button
                size="sm"
                className="h-7 bg-gradient-primary px-3 text-xs font-semibold"
                disabled={pending || rentWallet < 0.01}
                onClick={() => run({ type: "collectRent" }, "Collected rent")}
              >
                Collect Rent
              </Button>
            </div>

            {/* New Facility Button inside Owned Real Estate Panel */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="text-[11px] text-muted-foreground">
                Owned Properties: <b className="text-foreground font-mono">{ownedProps.length}</b>
              </span>
              <Button
                size="sm"
                onClick={() => setReMarketOpen(true)}
                className="h-7 gap-1 bg-primary/90 hover:bg-primary px-3 text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                New Facility
              </Button>
            </div>
          </Card>

          {ownedProps.length === 0 ? (
            <Empty
              icon={<Home className="h-6 w-6" />}
              title="No properties owned"
              text="Press New Facility to open the Real Estate Marketplace listings."
              action={
                <Button size="sm" onClick={() => setReMarketOpen(true)} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  New Facility
                </Button>
              }
            />
          ) : (
            propertyRows.map(({ pr, e }) => {
              const d = PROPERTIES.find((x) => x.id === pr.defId)!;
              return (
                <Link key={pr.inst} to="/realestate/$inst" params={{ inst: pr.inst }}>
                  <Card className="mb-2 flex items-center gap-3 p-2.5 hover:border-primary/40 transition-colors">
                    <BuildingSprite
                      propertyCategory={d.category}
                      propertyName={d.name}
                      fit="cover"
                      className="h-14 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30 p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{d.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Pill
                            tone={
                              pr.condition >= 65 ? "gain" : pr.condition >= 40 ? "warn" : "loss"
                            }
                          >
                            {conditionLabel(pr.condition)}
                          </Pill>
                          <Pill>{pct(e.occupancy, 0)}</Pill>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {d.category} · {d.location}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span
                          className={`num font-semibold ${e.net >= 0 ? "text-gain" : "text-loss"}`}
                        >
                          {money(e.net)}/h net
                        </span>
                        <span className="num text-[11px] text-muted-foreground">
                          Wallet:{" "}
                          <b className="text-gain">
                            {money(liveRentWallet(pr, e.net, s.lastTick, now))}
                          </b>
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </GameScrollContainer>
      )}

      {/* FULL-SCREEN MODAL OVERLAY: BUSINESS MARKETPLACE LISTINGS (100 Businesses) */}
      <Dialog open={bizMarketOpen} onOpenChange={setBizMarketOpen}>
        <DialogContent className="flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-2.5 overflow-hidden bg-background border-primary/45 p-3 sm:p-4">
          <DialogHeader className="shrink-0 pr-8 text-left">
            <DialogTitle className="flex items-center justify-between text-sm sm:text-base font-bold">
              <span>Business Marketplace Listings</span>
              <span className="text-xs font-mono font-normal text-muted-foreground">
                Slots: {ownedBiz.length}/{s.capacity.slots} · {filteredBusinesses.length} models
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Browse and acquire new business facilities.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 space-y-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search 100 businesses by name, industry, or model…"
                value={bizQuery}
                onChange={(e) => {
                  setBizQuery(e.target.value);
                  setBizPage(1);
                }}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {bizIndustries.map((ind) => (
                <button
                  type="button"
                  key={ind}
                  onClick={() => {
                    setBizIndustry(ind);
                    setBizPage(1);
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    bizIndustry === ind
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 space-y-1.5">
            {pagedBusinesses.map((d) => (
              <Card
                key={d.id}
                onClick={() => setDetail(d)}
                className="flex cursor-pointer items-center gap-3 p-2.5 transition-colors hover:border-primary/40"
              >
                <BuildingSprite
                  businessDefId={d.id}
                  fit="cover"
                  className="game-art h-12 w-14 shrink-0 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/15 via-muted/30 to-card"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs sm:text-sm font-semibold">{d.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {d.industry} · Base{" "}
                    <span className="num font-semibold text-gain">{money(d.revenue)}/h</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-xs sm:text-sm font-bold text-foreground">
                    {money(d.price)}
                  </div>
                  <div className="text-[10px] text-primary">Inspect</div>
                </div>
              </Card>
            ))}
          </div>

          {totalBizPages > 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={curBizPage <= 1}
                onClick={() => setBizPage((p) => Math.max(1, p - 1))}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <div className="font-mono text-muted-foreground text-[11px]">
                Page <span className="font-bold text-foreground">{curBizPage}</span> of{" "}
                {totalBizPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={curBizPage >= totalBizPages}
                onClick={() => setBizPage((p) => Math.min(totalBizPages, p + 1))}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FULL-SCREEN MODAL OVERLAY: REAL ESTATE MARKETPLACE LISTINGS */}
      <Dialog open={reMarketOpen} onOpenChange={setReMarketOpen}>
        <DialogContent className="flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-2.5 overflow-hidden bg-background border-primary/45 p-3 sm:p-4">
          <DialogHeader className="shrink-0 pr-8 text-left">
            <DialogTitle className="flex items-center justify-between text-sm sm:text-base font-bold">
              <span>Real Estate Marketplace Listings</span>
              <span className="text-xs font-mono font-normal text-muted-foreground">
                {filteredProperties.length} available
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Browse and acquire rental real estate properties.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 space-y-1.5">
            {reLocked && (
              <Card className="flex items-center gap-2 border-warn/40 py-1.5 px-2.5 text-xs">
                <Lock className="h-3.5 w-3.5 text-warn shrink-0" />
                <span>Unlocks at Level {UNLOCKS.realEstate}.</span>
              </Card>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties by name, city, or category…"
                value={reQuery}
                onChange={(e) => {
                  setReQuery(e.target.value);
                  setRePage(1);
                }}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {reCats.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setReCat(c);
                    setRePage(1);
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    reCat === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 space-y-1.5">
            {pagedProperties.map((d) => (
              <Card key={d.id} className="flex items-center gap-3 p-2.5">
                <BuildingSprite
                  propertyCategory={d.category}
                  propertyName={d.name}
                  fit="cover"
                  className="game-art h-12 w-14 shrink-0 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/15 via-muted/30 to-card p-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs sm:text-sm font-semibold">{d.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {d.category} · {d.location}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs">
                    <span className="num font-semibold text-gain">{money(d.rent)}/h</span>
                    <span className="num font-semibold text-foreground">{money(d.price)}</span>
                  </div>
                </div>
                <Confirm
                  trigger={
                    <Button
                      size="sm"
                      className="h-7 shrink-0 px-3 text-xs bg-gradient-primary"
                      disabled={reLocked || pending || s.cash < d.price}
                    >
                      Buy
                    </Button>
                  }
                  title={`Buy ${d.name}?`}
                  description={`Deducts ${money(d.price)} from your balance.`}
                  onConfirm={() => run({ type: "buyProperty", defId: d.id }, "Property purchased")}
                />
              </Card>
            ))}
          </div>

          {totalRePages > 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={curRePage <= 1}
                onClick={() => setRePage((p) => Math.max(1, p - 1))}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <div className="font-mono text-muted-foreground text-[11px]">
                Page <span className="font-bold text-foreground">{curRePage}</span> of{" "}
                {totalRePages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={curRePage >= totalRePages}
                onClick={() => setRePage((p) => Math.min(totalRePages, p + 1))}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Company Purchase Sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto rounded-t-2xl p-4">
          {detail && (
            <>
              <SheetHeader className="flex flex-row items-center justify-between pr-6">
                <SheetTitle className="text-base">{detail.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-2 flex items-center gap-3">
                <BuildingSprite
                  businessDefId={detail.id}
                  fit="cover"
                  className="game-art h-20 w-24 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30 p-1"
                />
                <p className="text-xs text-muted-foreground">{detail.modelDesc}</p>
              </div>
              <div className="mt-2 divide-y divide-border">
                <Row label="Price" value={money(detail.price)} />
                <Row label="Base revenue /h" value={money(detail.revenue)} tone="gain" />
                <Row label="Fixed expenses /h" value={money(detail.fixedExpense)} />
                <Row label="Starting reserves" value={money(detail.reserves)} />
                {detail.liabilities > 0 && (
                  <Row label="Liabilities" value={money(detail.liabilities)} tone="warn" />
                )}
                <Row label="Workforce" value={`${detail.startStaff} / ${detail.staffCapacity}`} />
                <Row
                  label="Branches"
                  value={
                    detail.branch
                      ? `Up to ${detail.branch.max} (${money(detail.branch.cost)})`
                      : "Single location"
                  }
                />
              </div>
              <Confirm
                trigger={
                  <Button
                    className="mt-3 h-10 w-full bg-gradient-primary text-xs font-semibold"
                    disabled={
                      pending || s.cash < detail.price || ownedBiz.length >= s.capacity.slots
                    }
                  >
                    {ownedBiz.length >= s.capacity.slots
                      ? "No free company slots"
                      : s.cash < detail.price
                        ? `Need ${money(detail.price - s.cash)} more`
                        : `Buy for ${money(detail.price)}`}
                  </Button>
                }
                title={`Buy ${detail.name}?`}
                description={`${money(detail.price)} will be deducted from your cash balance.`}
                onConfirm={() =>
                  run({ type: "buyCompany", defId: detail.id }, `Acquired ${detail.name}`).then(
                    () => {
                      setDetail(null);
                      setBizMarketOpen(false);
                    },
                  )
                }
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
