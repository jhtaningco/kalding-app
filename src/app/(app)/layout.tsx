import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { AppHeader } from "@/components/layout/AppHeader";
import { calculateStreak } from "@/core/streak";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Graceful fallback if Supabase credentials are not yet set in .env.local
  if (!supabaseUrl) {
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar streak={0} points={0} exitHref="/design" />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="flex items-center gap-3">
            <Kalding mood="thinking" size={96} />
            <SpeechBubble>
              I need Supabase credentials to manage your profile!
            </SpeechBubble>
          </div>
          <Card className="mt-6 flex flex-col gap-4 text-left">
            <h2 className="text-foreground text-xl font-extrabold">
              Supabase Configuration Required
            </h2>
            <p className="text-muted text-sm">
              To test authentication and save your profile, copy{" "}
              <code className="bg-border/40 rounded px-1.5 py-0.5 font-mono text-xs">
                .env.example
              </code>{" "}
              to{" "}
              <code className="bg-border/40 rounded px-1.5 py-0.5 font-mono text-xs">
                .env.local
              </code>{" "}
              and fill in your Supabase project keys:
            </p>
            <pre className="border-border bg-background text-foreground overflow-x-auto rounded-xl border p-3 font-mono text-xs">
              {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/words" size="sm">
                Preview Word Bank
              </ButtonLink>
              <ButtonLink href="/design" size="sm" variant="secondary">
                View Design System
              </ButtonLink>
              <ButtonLink href="/login" size="sm" variant="ghost">
                Go to Sign In
              </ButtonLink>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let totalPoints = 0;
  let currentStreak = 0;

  try {
    const { data: attemptsData } = await supabase
      .from("attempts")
      .select("points_earned")
      .eq("user_id", user.id);

    if (attemptsData) {
      totalPoints = attemptsData.reduce((acc, a) => acc + (a.points_earned || 0), 0);
    }

    const { data: dailyStatsData } = await supabase
      .from("daily_stats")
      .select("date, points, words_practiced")
      .eq("user_id", user.id);

    if (dailyStatsData) {
      const activeDates: string[] = [];
      for (const entry of dailyStatsData) {
        if (entry.words_practiced > 0 || entry.points > 0) {
          activeDates.push(entry.date);
        }
      }
      currentStreak = calculateStreak(activeDates).currentStreak;
    }
  } catch (err) {
    console.warn("Failed to load header gamification data:", err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader streak={currentStreak} points={totalPoints} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
