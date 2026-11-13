import { useEffect, useState } from "react";
import { Briefcase, Clock, Lock, UserCheck } from "lucide-react";
import { useAct, useGame, useNow } from "@/hooks/use-game";
import {
  AVATAR_DEFS,
  BIO_MAX_LENGTH,
  DEFAULT_AVATAR,
  DEFAULT_TITLE,
  TITLE_DEFS,
  earnedTitles,
  ownedAvatars,
} from "@/game/profile";
import { duration } from "@/lib/format";
import { Card, Loading, Segmented } from "@/components/game/ui";
import { AVATAR_ICONS, PublicProfileCard } from "@/components/game/PublicProfileCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProfileView() {
  const { data } = useGame();
  const now = useNow(data?.offset ?? 0, 10_000);
  const { run, pending } = useAct();
  const [subView, setSubView] = useState<"public" | "edit">("public");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (data) {
      setTitle(data.state.profile.title || DEFAULT_TITLE);
      setBio(data.state.profile.bio || "");
    }
  }, [data]);

  if (!data) return <Loading />;
  const s = data.state;
  const availableTitles = earnedTitles(s);
  const unlockedAvatars = ownedAvatars(s);
  const activeAvatar = s.profile.avatar || DEFAULT_AVATAR;
  const cooldownUntil = s.profile.bioCooldownUntil ?? 0;
  const bioOnCooldown = cooldownUntil > now;
  const bioUnchanged = bio.trim() === (s.profile.bio || "").trim();
  const isFirstBioSet = !s.profile.bioUpdatedAt && !(s.profile.bio || "").trim();

  return (
    <div className="space-y-3">
      <Segmented
        value={subView}
        onChange={setSubView}
        options={[
          { id: "public", label: "Public View" },
          { id: "edit", label: "Edit Profile" },
        ]}
      />

      {subView === "public" ? (
        <div className="space-y-2.5">
          <div className="px-0.5 text-[11px] font-medium text-muted-foreground">
            Preview of how other players see your public profile when inspecting you:
          </div>
          <PublicProfileCard
            username={s.username}
            level={s.level}
            corpTag={data.corp?.tag ?? null}
            title={availableTitles.includes(s.profile.title) ? s.profile.title : DEFAULT_TITLE}
            avatar={unlockedAvatars.includes(activeAvatar) ? activeAvatar : DEFAULT_AVATAR}
            bio={s.profile.bio}
          />
        </div>
      ) : (
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-1.5 border-b border-border/60 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <UserCheck className="h-4 w-4 text-primary" />
            Edit Public Profile
          </div>

          {/* Avatar Emblem Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Avatar Emblem</span>
              <span className="text-[11px] text-muted-foreground">
                {unlockedAvatars.length}/{AVATAR_DEFS.length} acquired
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_DEFS.map((def) => {
                const I = AVATAR_ICONS[def.id as keyof typeof AVATAR_ICONS] ?? Briefcase;
                const unlocked = unlockedAvatars.includes(def.id);
                const selected = activeAvatar === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    disabled={!unlocked || pending}
                    title={unlocked ? def.label : `Locked: ${def.unlockDesc}`}
                    onClick={() => run({ type: "setProfile", avatar: def.id }, "Emblem updated")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-[10px] transition ${
                      selected
                        ? "border-primary bg-primary/20 text-primary font-semibold"
                        : unlocked
                          ? "border-border bg-background/60 text-foreground hover:border-primary/50"
                          : "border-border/50 bg-muted/40 text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <I className="h-4 w-4" />
                    <span className="truncate max-w-full">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Honorific Title Selector (Earned Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Title</span>
              <span className="text-[11px] text-muted-foreground">
                {availableTitles.length}/{TITLE_DEFS.length} earned
              </span>
            </div>
            <Select
              value={availableTitles.includes(title) ? title : DEFAULT_TITLE}
              onValueChange={(v) => {
                setTitle(v);
                void run({ type: "setProfile", title: v }, "Title updated");
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTitles.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Bio Description (100 char limit, instant first time, 3-day cooldown afterwards) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Profile Description</span>
              <span className="num text-[11px] text-muted-foreground">
                {bio.length} / {BIO_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              placeholder="Write a brief public description..."
              value={bio}
              maxLength={BIO_MAX_LENGTH}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
              className="min-h-[72px] text-xs"
            />
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {bioOnCooldown
                  ? `Next edit in ${duration(cooldownUntil - now)}`
                  : isFirstBioSet
                    ? "First bio sets immediately (3-day cooldown after)."
                    : "Saving applies a 3-day bio edit cooldown."}
              </span>
            </div>
            <Button
              size="sm"
              className="h-8 w-full bg-gradient-primary text-xs font-semibold"
              disabled={pending || bioOnCooldown || bioUnchanged}
              onClick={() => run({ type: "setProfile", bio }, "Description updated")}
            >
              {bioOnCooldown ? `Cooldown (${duration(cooldownUntil - now)})` : "Save Description"}
            </Button>
          </div>

          <div className="space-y-1.5 border-t border-border/60 pt-2">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span>Username</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Permanent
              </span>
            </div>
            <div className="flex h-9 items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 font-mono text-xs text-foreground">
              <span>@{s.username}</span>
              <span className="font-sans text-[11px] text-muted-foreground">
                Assigned at signup
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
