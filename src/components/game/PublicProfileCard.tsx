import { useQuery } from "@tanstack/react-query";
import { Briefcase, Crown, Gem, Rocket, Star } from "lucide-react";
import { getPlayerTier } from "@/components/game/art";
import { Card, Loading } from "@/components/game/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_AVATAR, DEFAULT_TITLE } from "@/game/profile";
import { getPublicPlayer } from "@/lib/game.functions";

export const AVATAR_ICONS = {
  briefcase: Briefcase,
  star: Star,
  rocket: Rocket,
  gem: Gem,
  crown: Crown,
} as const;

export type PublicProfileInput = {
  userId?: string;
  username: string;
  level?: number;
  corpTag?: string | null;
  title?: string;
  avatar?: string;
  bio?: string;
};

export function PublicProfileCard({
  username,
  level = 1,
  corpTag,
  title,
  avatar,
  bio,
}: PublicProfileInput) {
  const tierInfo = getPlayerTier(level);
  const Av = AVATAR_ICONS[(avatar || DEFAULT_AVATAR) as keyof typeof AVATAR_ICONS] ?? Briefcase;
  const displayTitle = title || DEFAULT_TITLE;
  const trimmedBio = (bio || "").trim();

  return (
    <Card className="space-y-3 border-primary/35 bg-card/90 p-4">
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-background/80 p-1.5">
            <img
              src={tierInfo.badgePath}
              alt={`${tierInfo.tierName} badge`}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-md border border-background bg-primary text-primary-foreground shadow">
            <Av className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-base font-bold text-foreground">@{username}</span>
            {corpTag && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                [{corpTag}]
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-primary">{displayTitle}</span>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
              {tierInfo.tierName} · {tierInfo.romanSublevel}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 text-xs">
        {trimmedBio ? (
          <p className="text-foreground/90">{trimmedBio}</p>
        ) : (
          <p className="italic text-muted-foreground">No profile description set.</p>
        )}
      </div>
    </Card>
  );
}

export function PublicProfileDialog({
  player,
  open,
  onOpenChange,
}: {
  player: PublicProfileInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: fetched, isLoading } = useQuery({
    queryKey: ["public-player", player?.userId],
    queryFn: () => getPublicPlayer(player!.userId!),
    enabled: open && !!player?.userId,
    staleTime: 30_000,
  });

  const merged: PublicProfileInput | null = player
    ? {
        userId: player.userId,
        username: fetched?.username ?? player.username,
        level: fetched?.level ?? player.level ?? 1,
        corpTag: fetched ? fetched.corpTag : (player.corpTag ?? null),
        title: fetched?.title ?? player.title ?? DEFAULT_TITLE,
        avatar: fetched?.avatar ?? player.avatar ?? DEFAULT_AVATAR,
        bio: fetched?.bio ?? player.bio ?? "",
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border/80 bg-card/95 p-4">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Public Profile</DialogTitle>
        </DialogHeader>
        {isLoading && !merged ? <Loading /> : merged ? <PublicProfileCard {...merged} /> : null}
      </DialogContent>
    </Dialog>
  );
}
