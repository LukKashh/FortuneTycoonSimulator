import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/game/ui";
import { ArrowLeft, Trophy, UserCheck } from "lucide-react";
import { ProfileView } from "./ProfileView";
import { AchievementsView } from "./AchievementsView";

export function AccountManagerMenu({ onClose: _onClose }: { onClose?: () => void }) {
  const [view, setView] = useState<"main" | "profile" | "achievements">("main");

  if (view === "profile") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("main")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account Manager
          </Button>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Profile Overview
          </span>
        </div>
        <ProfileView />
      </div>
    );
  }

  if (view === "achievements") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("main")}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account Manager
          </Button>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Achievements
          </span>
        </div>
        <AchievementsView />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Account Manager</h1>
        <p className="text-xs text-muted-foreground">
          Manage your public identity and review progression across achievement tracks.
        </p>
      </div>

      <div className="grid gap-3">
        {/* Option 1: Profile Overview */}
        <Card
          className="group cursor-pointer border-border/80 bg-card/90 p-4 transition-all hover:border-primary/60"
          onClick={() => setView("profile")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 transition-transform group-hover:scale-105">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm font-bold text-foreground">
                <span>1. Profile Overview</span>
                <span className="text-xs font-normal text-primary">&rarr;</span>
              </div>
              <div className="text-xs text-muted-foreground">
                View your public card and edit earned titles, emblems, and bio.
              </div>
            </div>
          </div>
        </Card>

        {/* Option 2: Achievements */}
        <Card
          className="group cursor-pointer border-border/80 bg-card/90 p-4 transition-all hover:border-primary/60"
          onClick={() => setView("achievements")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 transition-transform group-hover:scale-105">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm font-bold text-foreground">
                <span>2. Achievements</span>
                <span className="text-xs font-normal text-amber-400">&rarr;</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Track milestone progression tiers across all achievement types.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
