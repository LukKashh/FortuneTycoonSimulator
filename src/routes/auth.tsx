import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { art } from "@/components/game/art";
import {
  auth as firebaseAuth,
  onAuthStateChanged,
  signInWithGoogle,
  logOut,
  type User,
} from "@/lib/firebase";
import {
  checkPlayerAccount,
  checkUsernameAvailability,
  createAccountWithUsername,
  ensureInitialDatabaseWipe,
} from "@/lib/game.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { setup?: "true" | "false" } => ({
    ...(s.setup === "true" ? { setup: "true" as const } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Capitalfortune — Enter Empire" },
      {
        name: "description",
        content: "Sign in with Google and claim your tycoon username to enter Capitalfortune.",
      },
      { property: "og:title", content: "Capitalfortune — Enter Empire" },
      { property: "og:description", content: "Sign in with Google to start your empire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthEntryRoute,
});

function AuthEntryRoute() {
  const search = Route.useSearch();
  return <UnifiedEntryScreen forceSetup={search.setup === "true"} />;
}

export function UnifiedEntryScreen({ forceSetup = false }: { forceSetup?: boolean }) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(firebaseAuth.currentUser);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submittingUsername, setSubmittingUsername] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function evaluateUser(user: User | null) {
      if (!active) return;
      setCurrentUser(user);

      if (!user) {
        setCheckingAuth(false);
        setNeedsUsername(false);
        return;
      }

      try {
        const wipeRes = await ensureInitialDatabaseWipe();
        if (wipeRes.wiped) {
          toast.success(
            `Database reset complete (${wipeRes.deletedCount} records cleared). Choose your username.`,
          );
        }

        const account = await checkPlayerAccount(user.uid);
        if (!active) return;

        if (account.exists && !forceSetup) {
          navigate({ to: "/home", replace: true });
        } else {
          setNeedsUsername(true);
          if (user.displayName) {
            const sanitized = user.displayName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14);
            if (sanitized.length >= 3) {
              setUsername(sanitized);
            }
          }
        }
      } catch (err) {
        console.warn("Account status evaluation error:", err);
        setNeedsUsername(true);
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      void evaluateUser(user);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate, forceSetup]);

  useEffect(() => {
    if (!needsUsername || !username.trim()) {
      setUsernameStatus("idle");
      setUsernameError(null);
      return;
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setUsernameStatus("unavailable");
      setUsernameError("Minimum 3 characters.");
      return;
    }
    if (trimmed.length > 20) {
      setUsernameStatus("unavailable");
      setUsernameError("Maximum 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setUsernameStatus("unavailable");
      setUsernameError("Letters, numbers, hyphens, and underscores only.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(trimmed);
        startTransition(() => {
          if (res.available) {
            setUsernameStatus("available");
            setUsernameError(null);
          } else {
            setUsernameStatus("unavailable");
            setUsernameError(res.error || "Username is already taken.");
          }
        });
      } catch (err) {
        setUsernameStatus("unavailable");
        setUsernameError(err instanceof Error ? err.message : "Unable to verify username.");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, needsUsername]);

  async function handleGoogleSignIn() {
    setBusyGoogle(true);
    try {
      const cred = await signInWithGoogle();
      const user = cred.user;
      setCurrentUser(user);

      const wipeRes = await ensureInitialDatabaseWipe();
      if (wipeRes.wiped) {
        toast.success(
          `Database reset complete (${wipeRes.deletedCount} records cleared). Choose your username.`,
        );
      }

      const account = await checkPlayerAccount(user.uid);
      if (account.exists) {
        toast.success(`Welcome back, ${account.username}!`);
        navigate({ to: "/home", replace: true });
      } else {
        setNeedsUsername(true);
        toast.info("Choose your permanent tycoon username.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusyGoogle(false);
    }
  }

  async function handleAssignUsername(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus === "unavailable" || username.trim().length < 3) return;

    setSubmittingUsername(true);
    try {
      const res = await createAccountWithUsername(username.trim());
      toast.success(`Welcome, ${res.username}!`);
      navigate({ to: "/home", replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to claim username.");
      setUsernameStatus("unavailable");
      setUsernameError(err instanceof Error ? err.message : "Username claim failed");
    } finally {
      setSubmittingUsername(false);
    }
  }

  async function handleSignOut() {
    await logOut();
    setCurrentUser(null);
    setNeedsUsername(false);
    setUsername("");
    toast.info("Signed out");
  }

  return (
    <main className="entry-screen relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-6 text-white">
      <img src={art("entry-city")} alt="" aria-hidden="true" className="entry-backdrop" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,14,28,.75)_0%,rgba(5,8,17,.96)_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-violet-600/20 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-64 w-64 rounded-full bg-cyan-500/15 blur-[90px]" />

      <section className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-white/15 bg-[#0d1220]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-2xl sm:p-6">
          {/* Compact Brand Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-500/30 to-cyan-500/15 text-violet-100 shadow-glow">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="brand-name mt-3 text-2xl font-bold tracking-tight text-white">
              Capital<span>fortune</span>
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Start from $0 · Build companies, trade &amp; expand
            </p>
          </div>

          <div className="mt-6">
            {checkingAuth ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                <p className="mt-2.5 text-xs font-mono text-slate-400">Checking session…</p>
              </div>
            ) : needsUsername ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    <UserIcon className="h-3 w-3" /> Choose Username
                  </span>
                  <span className="text-[10px] text-slate-500">Permanent ID</span>
                </div>

                {currentUser && (
                  <div className="mb-3.5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt=""
                          className="h-6 w-6 rounded-full border border-white/20"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/30 text-[10px] font-bold text-violet-200">
                          G
                        </div>
                      )}
                      <span className="truncate text-xs font-medium text-white">
                        {currentUser.email || currentUser.displayName || "Google Account"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="h-6 gap-1 px-1.5 text-[10px] text-slate-400 hover:text-white"
                    >
                      <LogOut className="h-3 w-3" /> Switch
                    </Button>
                  </div>
                )}

                <form onSubmit={handleAssignUsername} className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="username" className="text-xs font-medium text-slate-300">
                        Tycoon Handle
                      </Label>
                      {usernameStatus === "checking" && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking
                        </span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Available
                        </span>
                      )}
                      {usernameStatus === "unavailable" && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-rose-400">
                          <XCircle className="h-3 w-3" /> Unavailable
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                        @
                      </span>
                      <Input
                        id="username"
                        type="text"
                        autoFocus
                        required
                        maxLength={20}
                        placeholder="ApexTycoon"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                        className={`h-11 rounded-xl border bg-black/35 pl-7 pr-3 font-mono text-sm text-white placeholder:text-slate-600 focus-visible:ring-violet-400 ${
                          usernameStatus === "available"
                            ? "border-emerald-500/50 focus-visible:ring-emerald-400"
                            : usernameStatus === "unavailable"
                              ? "border-rose-500/50 focus-visible:ring-rose-400"
                              : "border-white/10"
                        }`}
                      />
                    </div>

                    {usernameError ? (
                      <p className="text-[10px] text-rose-400">{usernameError}</p>
                    ) : (
                      <p className="text-[10px] text-slate-500">
                        3–20 chars · locked permanently after creation
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      submittingUsername ||
                      usernameStatus !== "available" ||
                      username.trim().length < 3
                    }
                    className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 disabled:opacity-50"
                  >
                    {submittingUsername ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Launching…
                      </>
                    ) : (
                      <>
                        Confirm &amp; Enter Empire <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={busyGoogle}
                  className="h-12 w-full gap-2.5 rounded-xl border border-white/15 bg-white text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 disabled:opacity-50"
                >
                  {busyGoogle ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Google Auth · Cloud Firestore Sync</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
