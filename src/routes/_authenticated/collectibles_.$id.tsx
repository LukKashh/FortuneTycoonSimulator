import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import {
  CATEGORY_BY_ID,
  COLLECTIBLE_BY_ID,
  COLLECTIONS,
  GRADING_FEE_PCT,
  HOLD_HOURS,
  RESALE_PCT,
  collectibleStatBonus,
  collectibleValue,
  resolveCollectibleId,
} from "@/game/collectibles";
import { duration, money, pct } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameScrollContainer,
  Loading,
  Pill,
  Row,
} from "@/components/game/ui";
import { CollectibleIcon } from "@/components/game/CollectibleIcon";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/collectibles_/$id")({
  head: () => ({
    meta: [
      { title: "Asset Details — Capitalfortune" },
      { name: "description", content: "Fixed valuation, grading status, and ownership." },
      { property: "og:title", content: "Asset Details — Capitalfortune" },
      { property: "og:description", content: "Fixed valuation, grading status, and ownership." },
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
  const it = COLLECTIBLE_BY_ID[id] ?? COLLECTIBLE_BY_ID[resolveCollectibleId(id)];
  if (!data) return <Loading />;
  if (!it) return <Empty title="Item not found" />;
  const s = data.state;
  const cat = CATEGORY_BY_ID[it.category]!;
  const copies = Object.values(s.collectibles).filter(
    (o) => resolveCollectibleId(o.itemId) === it.id,
  );
  const cols = COLLECTIONS.filter((c) => c.items.includes(it.id));
  const ownedIds = new Set(
    Object.values(s.collectibles).map((o) => resolveCollectibleId(o.itemId)),
  );

  return (
    <GameScrollContainer className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/markets"
          search={{ tab: "assets" }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assets
        </Link>
        <Pill tone="muted">Fixed Asset</Pill>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/85 p-3">
        <CollectibleIcon
          category={it.category}
          itemId={it.id}
          rarity="Ungraded"
          className="h-14 w-14 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold">{it.name}</h1>
          <p className="text-xs text-muted-foreground">
            {cat.name} · {it.sub}
          </p>
          <div className="num mt-1 text-sm font-bold text-foreground">{money(it.price)}</div>
        </div>
      </div>

      <Card>
        <Row label="Fixed Base Price" value={money(it.price)} />
        <Row label="Initial Grade on Purchase" value="Ungraded Rarity" />
        <Row
          label="Grading Fee"
          value={`${pct(GRADING_FEE_PCT, 1)} (${money(it.price * GRADING_FEE_PCT)})`}
        />
        <Row
          label="Resale Terms"
          value={`${pct(RESALE_PCT, 0)} of graded value after ${HOLD_HOURS}h`}
        />
        <Row
          label="Passive Bonus Potential"
          value={
            it.bonusKey
              ? `Scales by graded rarity (${it.bonusKey.replace("Pct", "").replace("offlineHours", "Offline Hours").replace("feeCut", "Fee Cut")})`
              : "Prestige"
          }
        />
      </Card>

      <Confirm
        trigger={
          <Button
            className="h-10 w-full bg-gradient-primary text-xs font-semibold"
            disabled={pending || s.cash < it.price}
          >
            Buy Ungraded · {money(it.price)}
          </Button>
        }
        title={`Buy ${it.name}?`}
        description={`Deducts ${money(it.price)}. Received as Ungraded Rarity — grade it in Asset Management → Grading to reveal rarity and bonuses.`}
        onConfirm={() => run({ type: "buyCollectible", itemId: it.id, soldCount: 0 }, "Purchased")}
      />

      {copies.length > 0 && (
        <Card>
          <div className="mb-1.5 text-xs font-semibold">Owned Copies ({copies.length})</div>
          {copies.map((o) => {
            const grade = o.rarity ?? "Ungraded";
            const v = collectibleValue(it, grade);
            const bonus = collectibleStatBonus(it, grade);
            const canSell = now >= o.holdUntil;
            return (
              <div
                key={o.inst}
                className="flex items-center justify-between border-t border-border py-2 text-xs first:border-0"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{grade === "Ungraded" ? "Ungraded Rarity" : grade}</span>
                    {bonus && (
                      <Pill tone="gain">
                        +{bonus.key === "offlineHours" ? `${bonus.value}h` : pct(bonus.value, 2)}
                      </Pill>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Paid {money(o.price)} · Value {money(v)}
                  </div>
                </div>
                <Confirm
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs whitespace-nowrap"
                      disabled={!canSell || pending}
                    >
                      {!canSell ? duration(o.holdUntil - now) : `Sell ${money(v * RESALE_PCT)}`}
                    </Button>
                  }
                  title="Sell this copy?"
                  description={`Payout: ${money(v * RESALE_PCT)} (85% of ${money(v)}).`}
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
