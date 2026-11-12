import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import {
  CATEGORY_BY_ID,
  COLLECTIBLE_BY_ID,
  COLLECTIONS,
  HOLD_HOURS,
  RESALE_PCT,
  currentValue,
  demandLabel,
  valueSeries,
} from "@/game/collectibles";
import { getCollectibleStock } from "@/lib/game.functions";
import { date, duration, money, pct } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameScrollContainer,
  Loading,
  MiniChart,
  Pill,
  RangeTabs,
  Row,
  useRange,
} from "@/components/game/ui";
import { CollectibleIcon } from "@/components/game/CollectibleIcon";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/collectibles_/$id")({
  head: () => ({
    meta: [
      { title: "Asset Details — Capitalfortune" },
      { name: "description", content: "Item details, valuation history and ownership." },
      { property: "og:title", content: "Asset Details — Capitalfortune" },
      { property: "og:description", content: "Item details, valuation history and ownership." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ItemPage,
});

function ItemPage() {
  const { id } = Route.useParams();
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 30_000);
  const { run, pending } = useAct();
  const { range, setRange, ms } = useRange("30d");
  const { data: stock, refetch } = useQuery({
    queryKey: ["collectible-stock"],
    queryFn: () => getCollectibleStock(),
    staleTime: 30_000,
  });
  const it = COLLECTIBLE_BY_ID[id];
  const chart = useMemo(() => (it ? valueSeries(it, now - ms, now, 60) : []), [it, now, ms]);
  if (!data) return <Loading />;
  if (!it) return <Empty title="Item not found" />;
  const s = data.state;
  const cat = CATEGORY_BY_ID[it.category]!;
  const v = currentValue(it, now);
  const copies = Object.values(s.collectibles).filter((o) => o.itemId === it.id);
  const sold = stock?.[it.id] ?? 0;
  const released = !it.releaseAt || it.releaseAt <= now;
  const left = it.limited ? it.limited - sold : null;
  const cols = COLLECTIONS.filter((c) => c.items.includes(it.id));
  const ownedIds = new Set(Object.values(s.collectibles).map((o) => o.itemId));

  return (
    <GameScrollContainer className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/markets"
          search={{ tab: "assets" }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assets
        </Link>
        <div className="flex gap-1">
          <Pill tone="primary">{it.rarity}</Pill>
          <Pill tone={it.limited ? "gold" : "muted"}>
            {it.limited ? `Limited (${it.limited})` : "Standard"}
          </Pill>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/85 p-2.5">
        <CollectibleIcon category={it.category} rarity={it.rarity} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold">{it.name}</h1>
          <p className="text-xs text-muted-foreground">
            {cat.name} · {it.sub}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="num font-bold text-foreground">{money(v)}</span>
            <span className={`num ${v >= it.baseValue ? "text-gain" : "text-loss"}`}>
              ({pct(v / it.baseValue - 1, 1, true)})
            </span>
          </div>
        </div>
      </div>

      <Card className="p-2.5">
        <MiniChart data={chart} height={110} format={(x) => money(x)} />
        <div className="mt-2">
          <RangeTabs value={range} onChange={setRange} />
        </div>
      </Card>

      <Card>
        <Row label="Purchase price" value={money(it.price)} />
        <Row label="Current estimate" value={money(v)} />
        <Row label="Demand" value={demandLabel(it, now)} />
        <Row
          label="Availability"
          value={
            !released
              ? `Releases ${date(it.releaseAt!)}`
              : left === null
                ? "Available"
                : `${left} / ${it.limited} left`
          }
        />
        <Row
          label="Resale"
          value={
            it.restrictedResale
              ? "Restricted"
              : `${pct(RESALE_PCT[it.rarity], 0)} after ${HOLD_HOURS[it.rarity]}h`
          }
        />
        <Row
          label="Passive bonus"
          value={
            it.bonus
              ? `+${it.bonus.key === "offlineHours" ? `${it.bonus.value}h offline` : pct(it.bonus.value, 1) + " " + it.bonus.key.replace("Pct", "").replace("feeCut", "fee cut")}`
              : "Prestige"
          }
        />
      </Card>

      <Confirm
        trigger={
          <Button
            className="h-10 w-full bg-gradient-primary text-xs font-semibold"
            disabled={pending || !released || left === 0 || s.cash < it.price}
          >
            {!released ? "Not yet released" : left === 0 ? "Sold out" : `Buy · ${money(it.price)}`}
          </Button>
        }
        title={`Buy ${it.name}?`}
        description={`Deducts ${money(it.price)} from your balance. Hold period: ${HOLD_HOURS[it.rarity]}h.`}
        onConfirm={() =>
          run({ type: "buyCollectible", itemId: it.id, soldCount: sold }, "Purchased").then(() =>
            refetch(),
          )
        }
      />

      {copies.length > 0 && (
        <Card>
          <div className="mb-1.5 text-xs font-semibold">Owned Copies ({copies.length})</div>
          {copies.map((o) => {
            const canSell = !it.restrictedResale && now >= o.holdUntil;
            return (
              <div
                key={o.inst}
                className="flex items-center justify-between border-t border-border py-1.5 text-xs first:border-0"
              >
                <div>
                  <div className="font-medium">Copy #{o.inst}</div>
                  <div className="text-[10px] text-muted-foreground">Paid {money(o.price)}</div>
                </div>
                <Confirm
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={!canSell || pending}
                    >
                      {it.restrictedResale
                        ? "Restricted"
                        : now < o.holdUntil
                          ? duration(o.holdUntil - now)
                          : `Sell ${money(v * RESALE_PCT[it.rarity])}`}
                    </Button>
                  }
                  title="Sell this copy?"
                  description={`Payout: ${money(v * RESALE_PCT[it.rarity])}.`}
                  onConfirm={() => run({ type: "sellCollectible", inst: o.inst }, "Sold")}
                />
              </div>
            );
          })}
        </Card>
      )}

      {cols.length > 0 && (
        <Card>
          <div className="mb-1 text-xs font-semibold">Set Progress</div>
          {cols.map((c) => (
            <Row
              key={c.id}
              label={c.name}
              value={`${c.items.filter((i) => ownedIds.has(i)).length}/${c.items.length}`}
            />
          ))}
        </Card>
      )}
    </GameScrollContainer>
  );
}
