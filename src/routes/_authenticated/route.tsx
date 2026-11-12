import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth, onAuthStateChanged, type User } from "@/lib/firebase";
import { checkPlayerAccount, ensureInitialDatabaseWipe } from "@/lib/game.functions";
import { AppShell } from "@/components/game/AppShell";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-mono text-muted-foreground">Loading Capitalfortune...</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: LoadingScreen,
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      throw redirect({ to: "/auth" });
    }
    const user = (await new Promise((resolve) => {
      if (auth.currentUser) return resolve(auth.currentUser);
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 3000);
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(u);
      });
    })) as User | null;

    if (!user) throw redirect({ to: "/auth" });

    await ensureInitialDatabaseWipe();

    const account = await checkPlayerAccount(user.uid);
    if (!account.exists) {
      throw redirect({ to: "/auth", search: { setup: "true" } });
    }

    return { user, account };
  },
  component: AppShell,
});
