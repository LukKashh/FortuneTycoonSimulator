import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { BALANCE, PROPERTY_BY_ID, PROPERTY_UPGRADES } from "@/game/config";
import { conditionLabel, personalMods, propertyEcon, propertyValue } from "@/game/engine";
import { corpMods } from "@/game/corp";
import { date, money, pct } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameScrollContainer,
  Loading,
  Pill,
  Progress,
  Row,
} from "@/components/game/ui";
import { BuildingSprite } from "@/components/game/BuildingSprite";
import { WALLET_REFRESH_MS, liveRentWallet } from "@/components/game/wallet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/realestate_/$inst")({
  head: () => ({
    meta: [
      { title: "Property — Capitalfortune" },
      { name: "description", content: "Rental performance, maintenance and upgrades." },
      { property: "og:title", content: "Property — Capitalfortune" },
      { property: "og:description", content: "Rental performance, maintenance and upgrades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PropertyPage,
});

function PropertyPage() {
  const { inst } = Route.useParams();
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, WALLET_REFRESH_MS);
  const { run, pending } = useAct();
  const navigate = useNavigate();
  if (!data) return <Loading />;
  const s = data.state;
  const pr = s.properties[inst];
  if (!pr)
    return (
      <Empty
        title="Property not found"
        action={
          <Button asChild size="sm">
            <Link to="/empire" search={{ section: "realestate" }}>
              Back to Empire
            </Link>
          </Button>
        }
      />
    );
  const d = PROPERTY_BY_ID[pr.defId]!;
  const e = propertyEcon(pr, personalMods(s), corpMods(data.corp), now);
  const value = propertyValue(pr);
  const maintCost = Math.round(pr.price * 0.02 * ((100 - pr.condition) / 100) + 50);
  const walletAmt = liveRentWallet(pr, e.net, s.lastTick, now);

  return (
    <GameScrollContainer className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/empire"
          search={{ section: "realestate" }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Real Estate
        </Link>
        <Pill tone={pr.condition >= 65 ? "gain" : pr.condition >= 40 ? "warn" : "loss"}>
          {conditionLabel(pr.condition)} · {Math.round(pr.condition)}%
        </Pill>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/85 p-2.5">
        <BuildingSprite
          propertyCategory={d.category}
          propertyName={d.name}
          fit="cover"
          className="h-16 w-20 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 via-muted/30 to-card border border-primary/30 p-1"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold">{d.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {d.category} · {d.location} · {date(pr.boughtAt)}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span>
              Net: <b className={e.net >= 0 ? "text-gain" : "text-loss"}>{money(e.net)}/h</b>
            </span>
            <span>
              Occ: <b>{pct(e.occupancy, 0)}</b>
            </span>
          </div>
        </div>
      </div>

      <Card className="border-primary/35 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Rent Wallet · {money(e.net)}/h
            </div>
            <div className="num text-lg font-bold text-gain">{money(walletAmt)}</div>
          </div>
          <Button
            size="sm"
            className="h-8 bg-gradient-primary px-3 text-xs font-semibold"
            disabled={pending || walletAmt < 0.01}
            onClick={() => run({ type: "collectRent", inst }, "Transferred to balance")}
          >
            Collect Rent
          </Button>
        </div>
      </Card>

      <Card>
        <Row label="Gross rent /h" value={money(e.gross)} tone="gain" />
        <Row label="Expenses /h" value={money(-e.expenses)} />
        <Row label="Net rent /h" value={money(e.net)} tone={e.net >= 0 ? "gain" : "loss"} />
        <Row label="Demand multiplier" value={`×${e.demand.toFixed(2)}`} />
        <Row label="Lifetime rent" value={money(pr.rentTotal)} />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold">Condition ({Math.round(pr.condition)}%)</div>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            disabled={pending || pr.condition >= 99}
            onClick={() => run({ type: "maintain", inst }, "Maintenance done")}
          >
            Maintain · {money(maintCost)}
          </Button>
        </div>
        <Progress value={pr.condition / 100} className="mt-2" />
      </Card>

      <div className="space-y-1.5">
        {PROPERTY_UPGRADES.filter((u) => u.categories.includes(d.category)).map((u) => {
          const lvl = pr.upgrades[u.id] ?? 0;
          const cost = Math.round(d.price * u.costPct * Math.pow(1.5, lvl));
          const locked = u.research && !s.research.done.includes(u.research);
          return (
            <Card key={u.id} className="flex items-center justify-between gap-2 p-2.5">
              <div className="min-w-0">
                <div className="text-xs font-semibold">
                  {u.name}{" "}
                  <span className="text-[10px] text-muted-foreground">
                    {lvl}/{u.max}
                  </span>
                </div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {u.desc}
                  {locked ? " · requires R&D" : ""}
                </div>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                disabled={pending || lvl >= u.max || !!locked || s.cash < cost}
                onClick={() => run({ type: "propertyUpgrade", inst, upgradeId: u.id }, "Upgraded")}
              >
                {lvl >= u.max ? "Max" : money(cost)}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card>
        <Row label="Purchase price" value={money(pr.price)} />
        <Row label="Current value" value={money(value)} />
        <Row
          label="Resale payout (75%)"
          value={money(value * BALANCE.propertyResalePct)}
          tone="gain"
        />
        <Confirm
          destructive
          trigger={
            <Button
              variant="destructive"
              size="sm"
              className="mt-2 w-full text-xs"
              disabled={pending}
            >
              Sell Property
            </Button>
          }
          title="Sell this property?"
          description={`Payout: ${money(value * BALANCE.propertyResalePct)}.`}
          confirmLabel="Sell"
          onConfirm={() =>
            run({ type: "sellProperty", inst }, "Property sold").then(() =>
              navigate({ to: "/empire", search: { section: "realestate" } }),
            )
          }
        />
      </Card>
    </GameScrollContainer>
  );
}
