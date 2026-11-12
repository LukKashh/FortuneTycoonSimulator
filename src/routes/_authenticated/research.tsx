import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpCircle,
  Building2,
  FlaskConical,
  Home,
  LineChart,
  MousePointerClick,
} from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import { BALANCE, RESEARCH, RESEARCH_BY_ID, type ResearchCategory } from "@/game/config";
import { mult, personalMods, researchDuration, UNLOCKS } from "@/game/engine";
import { corpMods } from "@/game/corp";
import { duration, money } from "@/lib/format";
import {
  Card,
  Confirm,
  Empty,
  GameScrollContainer,
  Loading,
  PageHeader,
  Pill,
  Progress,
  Stat,
} from "@/components/game/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "R&D Facility — Research & Development · Capitalfortune" },
      {
        name: "description",
        content: "Central R&D facility, tier upgrades, and research categories.",
      },
      { property: "og:title", content: "R&D Facility — Research & Development · Capitalfortune" },
      {
        property: "og:description",
        content: "Central R&D facility, tier upgrades, and research categories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchPage,
});

const CATEGORY_TABS: {
  id: ResearchCategory;
  label: string;
  sub: string;
  icon: typeof Building2;
}[] = [
  {
    id: "businesses",
    label: "Businesses",
    sub: "Productivity & Facility Unlocks",
    icon: Building2,
  },
  {
    id: "realestate",
    label: "Real Estate",
    sub: "Production & Property Unlocks",
    icon: Home,
  },
  {
    id: "trading",
    label: "Trading",
    sub: "Per-Trade Limits & Fee Reduction",
    icon: LineChart,
  },
  {
    id: "user",
    label: "User Upgrades",
    sub: "Click Enhancement",
    icon: MousePointerClick,
  },
];

function ResearchPage() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0);
  const { run, pending } = useAct();
  const [category, setCategory] = useState<ResearchCategory>("businesses");

  if (!data) return <Loading />;
  const s = data.state;
  const p = personalMods(s);
  const r = s.research;
  const facLvl = r.built ? Math.max(1, r.facilityLevel ?? 1) : 0;
  const maxFacLvl = BALANCE.research.facilityCosts.length; // 10
  const nextFacilityCost = facLvl < maxFacLvl ? BALANCE.research.facilityCosts[facLvl] : undefined;
  const rpRate =
    BALANCE.research.rpPerHour *
    (1 + Math.max(0, facLvl - 1) * 0.25) *
    mult("rpPct", p, corpMods(data.corp));

  // Unconstructed R&D Facility (Level 0 -> Build Level 1 for $350,000)
  if (!r.built || facLvl === 0) {
    const buildCost = BALANCE.research.facilityCosts[0]; // $350,000
    return (
      <div className="space-y-3">
        <PageHeader title="R&D Facility" />
        <Empty
          icon={<FlaskConical className="h-6 w-6" />}
          title="Construct R&D Facility (Level 1)"
          text={`Requires Level ${UNLOCKS.research} · Costs ${money(buildCost)} · Unlocks Level 1 research technologies and generates ${BALANCE.research.rpPerHour} RP/h.`}
          action={
            <Confirm
              trigger={
                <Button
                  size="sm"
                  className="bg-gradient-primary font-semibold"
                  disabled={pending || s.level < UNLOCKS.research || s.cash < buildCost}
                >
                  {s.level < UNLOCKS.research
                    ? `Unlocks at Level ${UNLOCKS.research}`
                    : `Construct Facility · ${money(buildCost)}`}
                </Button>
              }
              title="Construct R&D Facility (Level 1)?"
              description={`Deducts ${money(buildCost)} to construct the Level 1 R&D Facility.`}
              onConfirm={() => run({ type: "buildResearch" }, "R&D Facility constructed")}
            />
          }
        />
      </div>
    );
  }

  // Filter projects in the selected category: show ONLY Unlocked Options (rest Hidden/Locked)
  const categoryAll = RESEARCH.filter((d) => d.category === category);
  const unlockedInCategory = categoryAll.filter(
    (d) => d.minFacilityLevel <= facLvl && d.prereq.every((reqId) => r.done.includes(reqId)),
  );
  const hiddenCount = categoryAll.length - unlockedInCategory.length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top R&D Overview Panel */}
      <div className="shrink-0 space-y-2 mb-2">
        <Card className="border-primary/40 bg-card/90 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary-glow">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold tracking-tight text-foreground truncate">
                    R&amp;D Facility Overview
                  </h1>
                  <Pill tone="primary">
                    Tier {facLvl} / {maxFacLvl}
                  </Pill>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {r.done.length}/{RESEARCH.length} Technologies Researched · +{rpRate.toFixed(0)}{" "}
                  RP/h
                </p>
              </div>
            </div>

            {/* R&D Facility Upgrade as a Whole (Levels 1 -> 10) */}
            {nextFacilityCost !== undefined ? (
              <Confirm
                trigger={
                  <Button
                    size="sm"
                    className="h-8 shrink-0 gap-1 bg-gradient-primary px-2.5 text-xs font-bold"
                    disabled={pending || s.cash < nextFacilityCost}
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    <span>
                      Lv.{facLvl + 1} · {money(nextFacilityCost)}
                    </span>
                  </Button>
                }
                title={`Upgrade R&D Facility to Level ${facLvl + 1}?`}
                description={`Costs ${money(nextFacilityCost)}. Unlocks Level ${facLvl + 1} research technologies across all categories, increases RP generation by +25%, and expands research slots at Levels 3, 6, and 9.`}
                onConfirm={() =>
                  run({ type: "upgradeFacility" }, `R&D Facility upgraded to Level ${facLvl + 1}`)
                }
              />
            ) : (
              <Pill tone="gain">MAX LEVEL 10</Pill>
            )}
          </div>

          {/* R&D Statistics Strip */}
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label="Facility Level" value={`Lv. ${facLvl} / ${maxFacLvl}`} tone="primary" />
            <Stat label="Research Slots" value={`${r.active.length} / ${r.slots} Active`} />
            <Stat
              label="Research Points"
              value={`${Math.floor(r.rp).toLocaleString()} RP`}
              tone="gain"
            />
          </div>

          {/* Active Research Progress Bars */}
          {r.active.length > 0 && (
            <div className="space-y-1.5 border-t border-border/60 pt-2">
              {r.active.map((a) => {
                const d = RESEARCH_BY_ID[a.id];
                if (!d) return null;
                const total = researchDuration(d.hours, p);
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-primary/30 bg-muted/25 px-2.5 py-1.5"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground">{d.name}</span>
                      <span className="num font-mono text-primary-glow">
                        {duration(a.endsAt - now)}
                      </span>
                    </div>
                    <Progress className="mt-1 h-1.5" value={1 - (a.endsAt - now) / total} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 4.1 Categorized Research Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = category === tab.id;
            const catItems = RESEARCH.filter((d) => d.category === tab.id);
            const catUnlocked = catItems.filter(
              (d) =>
                d.minFacilityLevel <= facLvl && d.prereq.every((reqId) => r.done.includes(reqId)),
            );
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/15 text-foreground shadow-sm"
                    : "border-border/70 bg-card/75 text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon
                  className={`h-4 w-4 shrink-0 ${
                    isSelected ? "text-primary-glow" : "text-muted-foreground"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-bold">{tab.label}</span>
                    <span className="font-mono text-[10px] text-primary-glow">
                      {catUnlocked.length}
                    </span>
                  </div>
                  <div className="truncate text-[9px] text-muted-foreground">{tab.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unlocked Research Options List for Selected Category */}
      <GameScrollContainer className="space-y-2">
        {unlockedInCategory.length === 0 ? (
          <Empty
            icon={<FlaskConical className="h-6 w-6" />}
            title="No unlocked research in this category yet"
            text="Upgrade your R&D Facility tier to unlock technologies in this branch."
          />
        ) : (
          unlockedInCategory.map((d) => {
            const done = r.done.includes(d.id);
            const active = r.active.some((x) => x.id === d.id);
            return (
              <Card key={d.id} className={`p-2.5 ${done ? "opacity-75" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-foreground">{d.name}</span>
                      <Pill tone="muted" className="text-[9px]">
                        Facility Lv.{d.minFacilityLevel}
                      </Pill>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{d.desc}</div>
                  </div>
                  {done ? (
                    <Pill tone="gain">Complete</Pill>
                  ) : active ? (
                    <Pill tone="primary">Running</Pill>
                  ) : (
                    <Pill tone="primary">Available</Pill>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Pill>{money(d.cost)}</Pill>
                    <Pill>{d.rp} RP</Pill>
                    <Pill>{duration(researchDuration(d.hours, p))}</Pill>
                  </div>

                  {!done && !active && (
                    <Confirm
                      trigger={
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs bg-gradient-primary font-semibold"
                          disabled={
                            pending || r.rp < d.rp || s.cash < d.cost || r.active.length >= r.slots
                          }
                        >
                          Research
                        </Button>
                      }
                      title={`Start ${d.name}?`}
                      description={`${money(d.cost)} and ${d.rp} RP are deducted immediately. Research cannot be cancelled once started.`}
                      onConfirm={() => run({ type: "startResearch", id: d.id }, "Research started")}
                    />
                  )}
                </div>
              </Card>
            );
          })
        )}

        {hiddenCount > 0 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-3 py-2 text-center text-[11px] text-muted-foreground">
            {hiddenCount} additional {CATEGORY_TABS.find((t) => t.id === category)?.label} research{" "}
            {hiddenCount === 1 ? "project is" : "projects are"} hidden until unlocked via higher
            R&amp;D Facility Levels or prerequisite completions.
          </div>
        )}
      </GameScrollContainer>
    </div>
  );
}
