import { createClient } from "@/lib/supabase/server";
import { calculateStreak } from "@/core/streak";
import { calculateLevel } from "@/core/levels";
import { calculateDailyGoalProgress } from "@/core/dailyGoal";
import { getDailyWordDateKey, getWordOfTheDay, DAILY_WORD_BONUS_XP } from "@/core/dailyWord";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckIcon, FlameIcon, StarIcon, BookOpenIcon } from "@/components/ui/icons";
import { StreakCard } from "@/components/gamification/StreakCard";
import { DailyGoalCard } from "@/components/gamification/DailyGoalCard";
import { LevelCard } from "@/components/gamification/LevelCard";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let totalXp = 0;
  let todayPoints = 0;
  const activeDates: string[] = [];

  if (user) {
    // 1. Fetch user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = profileData;

    // 2. Fetch total points from attempts
    const { data: attemptsData } = await supabase
      .from("attempts")
      .select("points_earned")
      .eq("user_id", user.id);

    if (attemptsData) {
      totalXp = attemptsData.reduce((acc, a) => acc + (a.points_earned || 0), 0);
    }

    // 3. Fetch daily stats for streak & today's goal
    const { data: dailyStatsData } = await supabase
      .from("daily_stats")
      .select("date, points, words_practiced")
      .eq("user_id", user.id);

    if (dailyStatsData) {
      const todayStr = new Date().toISOString().split("T")[0];
      for (const entry of dailyStatsData) {
        if (entry.words_practiced > 0 || entry.points > 0) {
          activeDates.push(entry.date);
        }
        if (entry.date === todayStr) {
          todayPoints = entry.points;
        }
      }
    }
  }

  // 4. Fetch words for Vocabulary of the Day
  const { data: dbWords } = await supabase.from("words").select("*");
  const words = dbWords ?? [];
  const dateKey = getDailyWordDateKey(new Date());
  const dailyWord = getWordOfTheDay(words, dateKey);

  let isDailyCompleted = false;
  if (user) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayAttempts } = await supabase
      .from("attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("mode", "daily_word")
      .gte("created_at", todayStart.toISOString())
      .limit(1);
    isDailyCompleted = (todayAttempts?.length ?? 0) > 0;
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Learner";
  const streak = calculateStreak(activeDates);
  const levelInfo = calculateLevel(totalXp);
  const dailyGoalProgress = calculateDailyGoalProgress(todayPoints, profile?.daily_goal);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-6 px-4 py-6 sm:py-10">
      <Chip variant="mode">Phase 7: Gamification & Home Dashboard</Chip>

      {/* Hero Mascot & Speech Greeting */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Kalding mood="body" size={170} title="Kalding the goat mascot" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="border-primary/40 bg-primary/10 text-primary flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black">
              <StarIcon size={13} /> Level {levelInfo.level} &bull; {levelInfo.title}
            </span>
            <span className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black">
              <FlameIcon size={13} /> {streak.currentStreak} Day Streak
            </span>
          </div>

          <SpeechBubble tail="left" className="text-base sm:text-lg">
            Mabuhay, <strong className="text-primary">{displayName}</strong>! You are a{" "}
            <strong>{levelInfo.title}</strong> with{" "}
            <strong>{totalXp} XP</strong>. {dailyGoalProgress.cheerMessage}
          </SpeechBubble>
        </div>
      </div>

      {/* Featured Vocabulary of the Day Hero Card */}
      {dailyWord && (
        <div className="border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 flex w-full flex-col gap-4 rounded-3xl border-2 p-6 shadow-md sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="border-primary/60 bg-primary text-on-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider">
                <StarIcon size={14} /> Word of the Day
              </span>
              <span className="text-muted text-xs font-extrabold">{dateKey}</span>
            </div>

            {isDailyCompleted ? (
              <span className="border-success-border bg-success-bg text-success-fg flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-black">
                <CheckIcon size={14} /> Completed Today (+{DAILY_WORD_BONUS_XP} XP)
              </span>
            ) : (
              <span className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-black">
                <FlameIcon size={13} /> +{DAILY_WORD_BONUS_XP} XP Daily Reward
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-left">
            <div className="flex flex-wrap items-baseline gap-3">
              <h3 className="text-primary text-3xl font-black sm:text-4xl">
                {dailyWord.word}
              </h3>
              <span className="text-muted text-sm font-bold italic">
                ({dailyWord.part_of_speech})
              </span>
            </div>
            <p className="text-foreground text-base font-bold sm:text-lg">
              {dailyWord.definition}
            </p>
            {dailyWord.example_sentence && (
              <p className="text-muted text-xs font-medium italic">
                &ldquo;{dailyWord.example_sentence}&rdquo;
              </p>
            )}
          </div>

          {/* 4-Step Drill Breakdown */}
          <div className="border-border/60 bg-background/50 flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-xs font-extrabold text-muted">
            <span>1. Recall & Spelling</span>
            <span aria-hidden="true" className="text-muted/60">&bull;</span>
            <span>2. Type Definition</span>
            <span aria-hidden="true" className="text-muted/60">&bull;</span>
            <span>3. Transcribe Sentence</span>
            <span aria-hidden="true" className="text-muted/60">&bull;</span>
            <span>4. Original Sentence</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-muted text-xs font-medium">
              Deep focus challenge: Master today&apos;s single word across spelling, full definition, and context sentence writing.
            </p>
            <ButtonLink
              href="/daily"
              size="lg"
              variant={isDailyCompleted ? "secondary" : "primary"}
              className="w-full sm:w-auto"
            >
              {isDailyCompleted ? (
                <>
                  <CheckIcon size={18} />
                  <span>Practice Daily Word Again</span>
                </>
              ) : (
                <>
                  <StarIcon size={18} />
                  <span>Start Daily Challenge (+{DAILY_WORD_BONUS_XP} XP)</span>
                </>
              )}
            </ButtonLink>
          </div>
        </div>
      )}

      {/* Main Practice Call to Action Card */}
      <div className="border-primary/40 bg-card flex w-full flex-col items-center gap-3 rounded-3xl border-2 p-6 text-center shadow-[0_4px_0_var(--secondary-shadow)] sm:p-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted text-xs font-extrabold tracking-wider uppercase">
            Interactive Typing Arena
          </span>
          <h2 className="text-foreground text-2xl font-black sm:text-3xl">
            Choose Your Learning Path
          </h2>
          <p className="text-muted max-w-md text-sm">
            Practice vocabulary through 5 specialized typing modes or review words scheduled
            in your spaced repetition queue.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <ButtonLink href="/practice" size="lg" className="min-w-[220px] text-lg">
            Enter Practice Arena
          </ButtonLink>
          <ButtonLink
            href="/review"
            variant="secondary"
            size="lg"
            className="min-w-[200px] text-lg"
          >
            Review Queue (SRS)
          </ButtonLink>
        </div>
      </div>

      {/* Gamification Stats Widgets Grid */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <DailyGoalCard progress={dailyGoalProgress} />
        <StreakCard streak={streak} />
        <LevelCard levelInfo={levelInfo} />
      </div>

      {/* Profile Overview Card */}
      <Card className="flex w-full flex-col gap-4 text-left">
        <div className="border-border flex items-center justify-between border-b-2 pb-3">
          <div className="flex items-center gap-2">
            <BookOpenIcon size={18} className="text-primary" />
            <h2 className="text-foreground text-lg font-extrabold">Learner Profile</h2>
          </div>
          <span className="border-success-border bg-success-bg text-success-fg flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold">
            <CheckIcon size={14} /> Active Session
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Email
            </dt>
            <dd className="text-foreground truncate font-mono text-sm font-bold">
              {user?.email ?? "Not logged in"}
            </dd>
          </div>

          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Display Name
            </dt>
            <dd className="text-foreground truncate text-sm font-bold">
              {profile?.display_name ?? displayName}
            </dd>
          </div>

          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Learning Language
            </dt>
            <dd className="text-foreground text-sm font-bold uppercase">
              {profile?.language ?? "en"} (English)
            </dd>
          </div>

          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Daily Target
            </dt>
            <dd className="text-foreground text-sm font-bold">
              {profile?.daily_goal ?? 100} points / day
            </dd>
          </div>
        </dl>

        <div className="border-border mt-2 flex flex-wrap items-center justify-between gap-3 border-t-2 pt-4">
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/words" size="sm" variant="secondary">
              Word Bank
            </ButtonLink>
            <ButtonLink href="/design" size="sm" variant="ghost">
              Design System
            </ButtonLink>
          </div>

          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="ghost" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
