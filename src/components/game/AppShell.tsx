import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MenuContext } from "@/context/menu";
import {
  Award,
  BarChart3,
  Dices,
  Briefcase,
  Building2,
  Coins,
  FlaskConical,
  Maximize,
  Minimize,
  LineChart,
  LogOut,
  User,
  Trophy,
  Landmark,
  Receipt,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGame } from "@/hooks/use-game";
import { auth, logOut } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BankingView } from "./BankingView";
import { TaxView } from "./TaxView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loading } from "./ui";
import { OfflineReportDialog } from "./OfflineReport";
import { checkDeveloperAccess, DeveloperToolsDialog } from "./DeveloperTools";

const NAV = [
  { to: "/markets", label: "Asset Management", icon: LineChart, also: ["/collectibles"] },
  { to: "/empire", label: "Empire Overview", icon: Building2, also: ["/realestate"] },
  { to: "/home", label: "Tap", icon: Coins, center: true },
  { to: "/research", label: "R&D", icon: FlaskConical },
  { to: "/corporation", label: "Corp", icon: Briefcase },
] as const;

const MORE = [
  { to: "/casino", label: "Casino", icon: Dices },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/achievements", label: "Achievements", icon: Award },
  { to: "/stats", label: "Statistics", icon: BarChart3 },
  { to: "/profile", label: "Profile & Settings", icon: User },
] as const;

export function AppShell() {
  const { data, isLoading, error, refetch } = useGame();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menu, setMenu] = useState(false);
  const [menuPanel, setMenuPanel] = useState<"tax" | null>(null);
  const [bankingOpen, setBankingOpen] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [developerToolsOpen, setDeveloperToolsOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const verify = () => {
      void checkDeveloperAccess().then((allowed) => {
        if (active) setIsDeveloper(allowed);
      });
    };
    verify();
    const unsubscribe = onAuthStateChanged(auth, () => {
      verify();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await logOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading)
    return (
      <div className="min-h-screen">
        <Loading />
      </div>
    );
  if (error || !data) {
    const isNewAccount =
      error instanceof Error &&
      (error.message.includes("Account not found") || error.message.includes("username"));
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isNewAccount
            ? "Your account needs a unique username before you can begin playing."
            : `Couldn't load your save: ${error instanceof Error ? error.message : "unknown error"}`}
        </p>
        <div className="flex gap-2">
          {isNewAccount ? (
            <Button
              className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
              onClick={() => navigate({ to: "/auth", search: { setup: "true" } })}
            >
              Choose Username
            </Button>
          ) : (
            <Button onClick={() => refetch()}>Retry</Button>
          )}
          <Button variant="outline" onClick={() => void signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }
  const s = data.state;

  return (
    <MenuContext.Provider value={{ openMenu: () => setMenu(true) }}>
      <div className="game-shell flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <main className="game-content mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pb-14 pt-2">
          <Outlet />
        </main>

        <nav className="game-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#942929] bg-background/95 backdrop-blur pb-safe">
          <div className="game-nav-inner mx-auto grid max-w-2xl grid-cols-5 border-[#942929]">
            {NAV.map((n) => {
              const active =
                path.startsWith(n.to) || ("also" in n && n.also.some((a) => path.startsWith(a)));
              return "center" in n ? (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-label="Clicker"
                  className="game-nav-center flex flex-col items-center justify-end pb-1"
                >
                  <span
                    className={cn(
                      "game-nav-center-badge -mt-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-glow bg-gradient-primary text-primary-foreground shadow-glow ring-4 ring-background",
                      !active && "opacity-85",
                    )}
                  >
                    <Coins className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px]",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {n.label}
                  </span>
                </Link>
              ) : (
                <Link
                  key={n.to}
                  to={n.to}
                  data-active={active}
                  className="game-nav-link flex flex-col items-center gap-0.5 py-1.5 text-[10px] text-muted-foreground"
                >
                  <n.icon className="game-icon h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent
            side="right"
            className="w-[88vw] max-w-[310px] p-0 flex flex-col h-full overflow-hidden bg-background border-l border-border"
          >
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle className="text-base font-bold text-foreground">
                {menuPanel === "tax" ? "Tax Center" : "Quick Menu"}
              </SheetTitle>
            </SheetHeader>

            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 space-y-3">
              {menuPanel ? (
                <div className="min-w-0 w-full max-w-full space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMenuPanel(null)}
                    className="h-7 gap-1.5 px-2 text-xs"
                  >
                    &larr; Back
                  </Button>
                  <TaxView />
                </div>
              ) : (
                <>
                  {/* Compact 2-Column Financial Services */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1.5">
                      Finance
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMenu(false);
                          setBankingOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-card p-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Landmark className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-foreground">
                            Bank &amp; Loans
                          </span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            Accounts
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuPanel("tax")}
                        className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-left transition-colors hover:border-amber-500/60 hover:bg-amber-500/5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                          <Receipt className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-foreground">
                            Taxes
                          </span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            Liabilities
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1">
                      Navigation
                    </div>
                    {MORE.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenu(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted/70",
                          path === item.to
                            ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                            : "text-foreground/90",
                        )}
                      >
                        <item.icon className="h-4 w-4 text-primary shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    {isDeveloper && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenu(false);
                          setDeveloperToolsOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-2 text-left text-xs font-medium text-violet-100 transition-colors hover:border-violet-300/40 hover:bg-violet-500/15"
                      >
                        <Code2 className="h-4 w-4 shrink-0 text-violet-300" />
                        <span>Developer Console</span>
                        <span className="ml-auto rounded bg-violet-300/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-violet-200">
                          Admin
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border">
                    <FullscreenToggle />
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-border bg-card/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMenu(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-loss hover:bg-loss/10 border border-loss/20"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={bankingOpen} onOpenChange={setBankingOpen}>
          <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-2 overflow-hidden p-3 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:p-4">
            <DialogHeader className="shrink-0 pr-8 text-left">
              <DialogTitle className="text-base font-bold">Bank &amp; Loans</DialogTitle>
              <DialogDescription className="sr-only">
                Manage banking accounts and loans.
              </DialogDescription>
            </DialogHeader>
            <div className="banking-view min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1">
              <BankingView />
            </div>
          </DialogContent>
        </Dialog>

        {isDeveloper && (
          <DeveloperToolsDialog open={developerToolsOpen} onOpenChange={setDeveloperToolsOpen} />
        )}

        {s.username && s.lastOffline && <OfflineReportDialog report={s.lastOffline} />}
      </div>
    </MenuContext.Provider>
  );
}

function FullscreenToggle() {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    setSupported(!!document.documentElement.requestFullscreen);
    const sync = () => setOn(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!supported) return null;
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };
  const Icon = on ? Minimize : Maximize;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="flex w-full items-center justify-start gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-primary" />
      {on ? "Exit full screen" : "Full screen"}
    </Button>
  );
}
