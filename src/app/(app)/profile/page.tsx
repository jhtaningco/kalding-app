import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { calculateStreak } from "@/core/streak";
import { calculateLevel } from "@/core/levels";
import {
  calculateOverallAccuracy,
  formatPracticeDuration,
  identifyWeakestWords,
  generate30DayHeatmap,
} from "@/core/stats";
import { ProfileView, type WeakWordWithDetails } from "./profile-view";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Learner Profile & Stats | Kalding English",
  description: "Review your vocabulary stats, typing accuracy, weak words, and streak history.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let totalXp = 0;
  let totalTimeMs = 0;
  let attempts: Tables<"attempts">[] = [];
  let userWords: Tables<"user_words">[] = [];
  const activeDates: string[] = [];

  if (user) {
    // 1. Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = profileData;

    // 2. Fetch attempts history
    const { data: attemptsData } = await supabase
      .from("attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (attemptsData) {
      attempts = attemptsData;
      totalXp = attempts.reduce((acc, a) => acc + (a.points_earned || 0), 0);
      totalTimeMs = attempts.reduce((acc, a) => acc + (a.time_ms || 0), 0);
    }

    // 3. Fetch user_words for mastered count
    const { data: userWordsData } = await supabase
      .from("user_words")
      .select("*")
      .eq("user_id", user.id);

    if (userWordsData) {
      userWords = userWordsData;
    }

    // 4. Fetch daily stats for streak & heatmap
    const { data: dailyStatsData } = await supabase
      .from("daily_stats")
      .select("date, words_practiced, points")
      .eq("user_id", user.id);

    if (dailyStatsData) {
      for (const d of dailyStatsData) {
        if (d.words_practiced > 0 || d.points > 0) {
          activeDates.push(d.date);
        }
      }
    }
  }

  // Calculate metrics
  const streak = calculateStreak(activeDates);
  const levelInfo = calculateLevel(totalXp);
  const overallAccuracy = calculateOverallAccuracy(attempts);
  const totalTimeFormatted = formatPracticeDuration(totalTimeMs);
  const masteredWordsCount = userWords.filter((w) => w.interval_days >= 7).length;
  const heatmapDays = generate30DayHeatmap(activeDates);

  // Identify weakest words
  const weakStats = identifyWeakestWords(attempts, 6);
  let weakWordsWithDetails: WeakWordWithDetails[] = [];

  if (weakStats.length > 0) {
    const weakWordIds = weakStats.map((w) => w.wordId);
    const { data: dbWords } = await supabase
      .from("words")
      .select("*")
      .in("id", weakWordIds);

    if (dbWords) {
      const wordMap = new Map<string, Tables<"words">>(dbWords.map((w) => [w.id, w]));
      weakWordsWithDetails = weakStats
        .map((s) => {
          const w = wordMap.get(s.wordId);
          if (!w) return null;
          return {
            ...s,
            word: w,
          };
        })
        .filter((item): item is WeakWordWithDetails => item !== null);
    }
  }

  // Format recent 10 attempts
  const recentAttempts = attempts.slice(0, 10).map((a) => ({
    id: a.id,
    wordText: a.typed_text || "Word",
    mode: a.mode,
    correct: a.correct,
    accuracy: Math.round(a.accuracy > 1 ? a.accuracy : a.accuracy * 100),
    pointsEarned: a.points_earned,
    createdAt: a.created_at,
  }));

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Learner";
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "Recently";

  return (
    <ProfileView
      displayName={displayName}
      email={user?.email || ""}
      joinedDate={joinedDate}
      levelInfo={levelInfo}
      streak={streak}
      overallAccuracy={overallAccuracy}
      totalTimeFormatted={totalTimeFormatted}
      totalAttemptsCount={attempts.length}
      masteredWordsCount={masteredWordsCount}
      heatmapDays={heatmapDays}
      weakWords={weakWordsWithDetails}
      recentAttempts={recentAttempts}
      userId={user?.id}
    />
  );
}
