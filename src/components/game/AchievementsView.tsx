import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, Trophy } from "lucide-react";
import { Card, Pill, Progress } from "@/components/game/ui";
import { useGame } from "@/hooks/use-game";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TRACKS,
  ACHIEVEMENT_TRACK_BY_ID,
  getTrackProgress,
  type AchievementTrack,
  type StatKey,
} from "@/game/achievements";
import { money, num } from "@/lib/format";
import { Button } from "@/components/ui/button";

function formatMetric(format: AchievementTrack["format"], value: number): string {
  if (format === "money") return money(value);
  if (format === "level") return `Lv ${Math.floor(value)}`;
  return num(Math.floor(value));
}

export function AchievementsView() {
  const { data } = useGame();
  const [selectedTrackId, setSelectedTrackId] = useState<StatKey | null>(null);
  if (!data) return null;
  const s = data.state;

  const trackSummaries = ACHIEVEMENT_TRACKS.map((track) =>
    getTrackProgress(track, s.stats, s.achievements),
  );
  const totalUnlocked = trackSummaries.reduce((sum, t) => sum + t.completedCount, 0);
  const totalTiers = ACHIEVEMENTS.length;
  const overallProgress = totalTiers > 0 ? totalUnlocked / totalTiers : 0;

  if (selectedTrackId && ACHIEVEMENT_TRACK_BY_ID[selectedTrackId]) {
    const summary = getTrackProgress(
      ACHIEVEMENT_TRACK_BY_ID[selectedTrackId]!,
      s.stats,
      s.achievements,
    );
    const { track, visibleDefs, completedCount, totalTiers: trackTotal, currentValue } = summary;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTrackId(null)}
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Achievement Types
          </Button>
          <Pill tone={completedCount === trackTotal ? "gain" : "primary"}>
            {completedCount} / {trackTotal}
          </Pill>
        </div>

        <Card className="space-y-2 border-primary/35 bg-card/90 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">{track.name}</h3>
              <p className="text-[11px] text-muted-foreground">{track.description}</p>
            </div>
            <div className="num text-right text-xs font-bold text-primary">
              {formatMetric(track.format, currentValue)}
            </div>
          </div>
          <Progress value={completedCount / trackTotal} className="h-1.5" />
        </Card>

        <div className="space-y-2">
          {visibleDefs.map((ach) => {
            const done = !!s.achievements[ach.id] || currentValue >= ach.target;
            const tierProgress = done ? 1 : Math.min(1, currentValue / ach.target);
            return (
              <Card
                key={ach.id}
                className={`space-y-2 p-3 ${done ? "border-gain/40 bg-gain/5" : "border-border/80 bg-card/85"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground sm:text-sm">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-gain" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span>{ach.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {ach.sub} · Target {formatMetric(track.format, ach.target)}
                    </div>
                  </div>
                  <Pill tone={done ? "gain" : "muted"}>
                    {done ? "Accomplished" : "Next Locked"}
                  </Pill>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{done ? "Completed" : "Progress"}</span>
                    <span className="num font-semibold text-foreground">
                      {formatMetric(track.format, Math.min(currentValue, ach.target))} /{" "}
                      {formatMetric(track.format, ach.target)}
                    </span>
                  </div>
                  <Progress value={tierProgress} className="h-1.5" />
                </div>

                <div className="text-[11px] text-muted-foreground">
                  Reward:{" "}
                  <span className="num font-medium text-foreground">{money(ach.reward.cash)}</span>
                  {ach.reward.rp > 0 && <span> · {ach.reward.rp.toLocaleString()} RP</span>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Banner */}
      <Card className="flex flex-col justify-between gap-2.5 border-primary/30 bg-card/85 p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Achievement Progress</div>
            <div className="num text-base font-bold text-foreground">
              {totalUnlocked} / {totalTiers} Tiers ({Math.round(overallProgress * 100)}%)
            </div>
          </div>
        </div>
        <div className="w-full sm:w-44">
          <Progress value={overallProgress} className="h-2" />
        </div>
      </Card>

      {/* Achievement Types Overview List */}
      <div className="space-y-2">
        {trackSummaries.map(
          ({ track, completedCount, totalTiers: total, currentValue, nextDef }) => (
            <Card
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              className="cursor-pointer space-y-2 p-3 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-foreground sm:text-sm">
                      {track.name}
                    </span>
                    <Pill tone={completedCount === total ? "gain" : "primary"}>
                      Tier {completedCount}/{total}
                    </Pill>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {nextDef
                      ? `Next: ${formatMetric(track.format, Math.min(currentValue, nextDef.target))} / ${formatMetric(track.format, nextDef.target)}`
                      : `All ${total} tiers accomplished`}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <Progress value={completedCount / total} className="h-1.5" />
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
