"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GoogleIcon } from "@/components/ui/icons";

type AuthMode = "login" | "signup";

function SearchParamsListener({
  onParams,
}: {
  onParams: (params: { next: string; error: string | null }) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onParams({
      next: searchParams.get("next") || "/",
      error: searchParams.get("error"),
    });
  }, [searchParams, onParams]);

  return null;
}

export function AuthForm({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [nextUrl, setNextUrl] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleParams = useCallback(
    ({ next, error: paramError }: { next: string; error: string | null }) => {
      if (next) setNextUrl(next);
      if (paramError === "auth-code-error") {
        setError("Authentication link expired or invalid. Please try again.");
      }
    },
    [],
  );

  const supabase = createClient();

  // Mood determination
  let currentMood: KaldingMood = "happy";
  let speechText =
    mode === "login"
      ? "Welcome back! Ready to type some words?"
      : "Join me! Learn English one keystroke at a time.";

  if (loading) {
    currentMood = "thinking";
    speechText = "Checking credentials...";
  } else if (error) {
    currentMood = "oops";
    speechText = error;
  } else if (infoMessage) {
    currentMood = "celebrate";
    speechText = infoMessage;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      );
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim() || undefined,
            },
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          // Direct login without email confirmation
          router.push(nextUrl);
          router.refresh();
        } else if (data.user) {
          // Email confirmation link sent
          setInfoMessage(
            "Account created! Check your email inbox to confirm your account, then sign in.",
          );
          setLoading(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        router.push(nextUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      );
      setLoading(false);
      return;
    }

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to initiate Google sign in.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Suspense fallback={null}>
        <SearchParamsListener onParams={handleParams} />
      </Suspense>

      {/* Mascot Header */}
      <div className="flex items-center gap-3">
        <Kalding mood={currentMood} size={92} title={`Kalding is ${currentMood}`} />
        <SpeechBubble className="flex-1 text-sm">{speechText}</SpeechBubble>
      </div>

      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        {/* Mode Switcher Tabs */}
        <div className="border-border bg-background grid grid-cols-2 gap-2 rounded-2xl border-2 p-1.5 text-center">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setInfoMessage(null);
            }}
            className={`rounded-xl py-2 text-sm font-extrabold tracking-wide uppercase transition-all ${
              mode === "login"
                ? "bg-card text-foreground shadow-[0_2px_0_var(--secondary-shadow)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setInfoMessage(null);
            }}
            className={`rounded-xl py-2 text-sm font-extrabold tracking-wide uppercase transition-all ${
              mode === "signup"
                ? "bg-card text-foreground shadow-[0_2px_0_var(--secondary-shadow)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="border-danger-border bg-danger-bg text-danger-fg rounded-2xl border-2 p-3.5 text-xs font-bold"
          >
            {error}
          </div>
        )}

        {/* Info / Success Alert */}
        {infoMessage && (
          <div
            role="status"
            className="border-success-border bg-success-bg text-success-fg rounded-2xl border-2 p-3.5 text-xs font-bold"
          >
            {infoMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="display-name"
                className="text-muted text-xs font-extrabold tracking-wider uppercase"
              >
                Your Name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Gian"
                autoComplete="name"
                disabled={loading}
                className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 w-full rounded-2xl border-2 px-4 font-bold focus:ring-4 focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-muted text-xs font-extrabold tracking-wider uppercase"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 w-full rounded-2xl border-2 px-4 font-bold focus:ring-4 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-muted text-xs font-extrabold tracking-wider uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              disabled={loading}
              className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 w-full rounded-2xl border-2 px-4 font-bold focus:ring-4 focus:outline-none"
            />
          </div>

          <Button type="submit" size="lg" fullWidth disabled={loading} className="mt-2">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <span className="bg-border h-0.5 flex-1" />
          <span className="text-muted text-xs font-bold tracking-wider uppercase">
            or
          </span>
          <span className="bg-border h-0.5 flex-1" />
        </div>

        {/* Google OAuth Button */}
        <Button
          variant="secondary"
          size="md"
          fullWidth
          disabled={loading}
          onClick={handleGoogleAuth}
        >
          <GoogleIcon size={18} />
          Continue with Google
        </Button>

        {/* Footer note */}
        <p className="text-muted text-center text-xs">
          By continuing, you agree to practice English consistently and feed Kalding
          words!
        </p>
      </Card>

      {/* Back to home / design links */}
      <div className="text-muted flex justify-center gap-4 text-xs font-bold">
        <Link href="/" className="hover:text-foreground hover:underline">
          Back to Home
        </Link>
        <span>•</span>
        <Link href="/design" className="hover:text-foreground hover:underline">
          Design System
        </Link>
      </div>
    </div>
  );
}
