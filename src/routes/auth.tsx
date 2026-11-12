import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Cloud,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
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
} from "@/lib/game.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { setup?: "true" | "false" } => ({
    ...(s.setup === "true" ? { setup: "true" as const } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Sign in with Google — Capitalfortune" },
      {
        name: "description",
        content: "Sign in with Google to create your account or access your cloud-saved empire.",
      },
      { property: "og:title", content: "Sign in with Google — Capitalfortune" },
      { property: "og:description", content: "Sign in with Google to start your empire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(firebaseAuth.currentUser);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  // Username onboarding state
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submittingUsername, setSubmittingUsername] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [, startTransition] = useTransition();

  // Monitor auth state & verify if existing user has a chosen username
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
        const account = await checkPlayerAccount(user.uid);
        if (!active) return;

        if (account.exists && !search.setup) {
          navigate({ to: "/home", replace: true });
        } else {
          // Account needs a username assigned before accessing gameplay!
          setNeedsUsername(true);
          // Suggest an initial username based on Google display name
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
  }, [navigate, search.setup]);

  // Debounced username availability checker
  useEffect(() => {
    if (!needsUsername || !username.trim()) {
      setUsernameStatus("idle");
      setUsernameError(null);
      return;
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setUsernameStatus("unavailable");
      setUsernameError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 20) {
      setUsernameStatus("unavailable");
      setUsernameError("Username cannot exceed 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setUsernameStatus("unavailable");
      setUsernameError("Only letters, numbers, hyphens, and underscores are allowed.");
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
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, needsUsername]);

  async function handleGoogleSignIn() {
    setBusyGoogle(true);
    try {
      const cred = await signInWithGoogle();
      const user = cred.user;
      setCurrentUser(user);

      // Verify if account already exists
      const account = await checkPlayerAccount(user.uid);
      if (account.exists) {
        toast.success(`Welcome back, ${account.username}!`);
        navigate({ to: "/home", replace: true });
      } else {
        // Needs username assignment first
        setNeedsUsername(true);
        toast.info("Google sign-in successful. Please choose your username.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
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
      toast.success(`Empire founded! Welcome, ${res.username}!`);
      navigate({ to: "/home", replace: true });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to claim username. Please try another.",
      );
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
    toast.info("Signed out of Google account");
  }

  return (
    <main className="entry-screen relative flex min-h-[100svh] items-center overflow-x-hidden px-4 py-7 text-white sm:px-6 lg:px-8">
      <img src={art("entry-city")} alt="" aria-hidden="true" className="entry-backdrop" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(5,8,17,.96)_0%,rgba(7,12,25,.88)_48%,rgba(9,13,26,.76)_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.8fr] lg:gap-16">
        {/* Left hero info section */}
        <section className="hidden lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Capitalfortune
          </Link>
          <div className="mt-16 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-medium text-violet-100">
            <Sparkles className="h-3.5 w-3.5" /> Firebase Cloud Saves · Google Auth
          </div>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
            Build your own
            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              Capitalfortune.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Start from $0. Make financial decisions, acquire industries, and shape an online empire
            that is securely tied to your Google account.
          </p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <Building2 className="h-5 w-5 text-violet-300" />
              <p className="mt-3 text-sm font-semibold">Build your empire</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Grow your business portfolio from scratch.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <Cloud className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-semibold">100% Firebase Cloud Save</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Continuous sync across browsers and devices.
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Cloud Firestore & Google Identity
            verified
          </div>
        </section>

        {/* Right card container */}
        <section className="mx-auto w-full max-w-md">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300">
              <ArrowLeft className="h-4 w-4" /> Capitalfortune
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Google Auth
            </span>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-[#0d1220]/90 p-5 shadow-[0_28px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/30 to-cyan-500/15 text-violet-100">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="brand-name text-lg text-white">
                  Capital<span>fortune</span>
                </div>
                <p className="text-[11px] tracking-wide text-slate-400">WEALTH BUILDER TYCOON</p>
              </div>
            </div>

            {checkingAuth ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                <p className="mt-4 text-sm font-mono text-slate-400">
                  Verifying Firebase session...
                </p>
              </div>
            ) : needsUsername ? (
              /* Step 2: Mandatory Username Selection for New Account */
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  <UserIcon className="h-3.5 w-3.5" /> Step 2: Tycoon Identity
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                  Choose Your Username
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Before entering the game, pick a unique name to assign your new tycoon empire and
                  appear on global leaderboards.
                </p>

                {/* Linked Google Account Banner */}
                {currentUser && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt=""
                          className="h-7 w-7 rounded-full border border-white/20"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600/30 text-[10px] font-bold text-violet-200">
                          G
                        </div>
                      )}
                      <div className="truncate">
                        <p className="truncate font-medium text-white">
                          {currentUser.displayName || "Google User"}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">{currentUser.email}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="h-7 gap-1 px-2 text-[11px] text-slate-400 hover:text-white"
                      title="Sign in with a different Google account"
                    >
                      <LogOut className="h-3 w-3" /> Switch
                    </Button>
                  </div>
                )}

                <form onSubmit={handleAssignUsername} className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="username" className="text-xs font-medium text-slate-200">
                        In-Game Username
                      </Label>
                      {usernameStatus === "checking" && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                        </span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Available!
                        </span>
                      )}
                      {usernameStatus === "unavailable" && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                          <XCircle className="h-3.5 w-3.5" /> Unavailable
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
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
                        className={`h-12 rounded-xl border bg-black/30 pl-8 pr-4 text-white font-mono placeholder:text-slate-600 focus-visible:ring-violet-400 ${
                          usernameStatus === "available"
                            ? "border-emerald-500/50 focus-visible:ring-emerald-400"
                            : usernameStatus === "unavailable"
                              ? "border-rose-500/50 focus-visible:ring-rose-400"
                              : "border-white/10"
                        }`}
                      />
                    </div>

                    {usernameError ? (
                      <p className="text-[11px] text-rose-400">{usernameError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        3 to 20 characters: letters, numbers, hyphens, and underscores.
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
                    className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 font-semibold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 disabled:opacity-50"
                  >
                    {submittingUsername ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Initializing Empire...
                      </>
                    ) : (
                      <>
                        Confirm & Launch Empire <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-5 border-t border-white/10 pt-4 text-center">
                  <p className="text-[11px] text-slate-400">
                    Once created, your username becomes your public profile identity across online
                    corporations and leaderboards.
                  </p>
                </div>
              </div>
            ) : (
              /* Step 1: Google Authentication View (Exclusive Login & Sign-up) */
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">
                  Firebase Cloud Account
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                  Sign in with Google
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Sign in or create your Capitalfortune account using Google Auth. Your wealth,
                  progress, and businesses will sync securely via Cloud Firestore.
                </p>

                <div className="mt-7 space-y-4">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={busyGoogle}
                    className="h-14 w-full gap-3 border border-white/15 bg-white text-base font-semibold text-slate-900 shadow-xl transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    {busyGoogle ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                        Connecting to Google...
                      </>
                    ) : (
                      <>
                        <svg
                          aria-hidden="true"
                          width="20"
                          height="20"
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
                </div>

                <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Exclusive Google Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Choose custom in-game username upon registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>Authoritative Cloud Firestore save states</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Secure Firebase Backend
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Cloud className="h-3.5 w-3.5 text-cyan-400" /> Persistent Tycoon Cloud Save
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-500">
            By continuing, you agree to play Capitalfortune with persistent cloud game saves.
          </p>
        </section>
      </div>
    </main>
  );
}
