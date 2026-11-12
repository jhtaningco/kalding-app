import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { calculateStreak, type StreakResult } from "@/core/streak";

export interface UserGamificationData {
  totalXp: number;
  streak: StreakResult;
  activeDates: string[];
}

/**
 * Single source of truth for user total XP and streak across all pages, layouts, and exercise engines.
 */
export async function getUserGamification(
  supabase: SupabaseClient<Database>,
  userId?: string | null,
): Promise<UserGamificationData> {
  if (!userId) {
    return {
      totalXp: 0,
      streak: calculateStreak([]),
      activeDates: [],
    };
  }

  const [{ data: userAttempts }, { data: dailyStatsData }] = await Promise.all([
    supabase.from("attempts").select("points_earned").eq("user_id", userId),
    supabase
      .from("daily_stats")
      .select("date, points, words_practiced")
      .eq("user_id", userId),
  ]);

  const totalXp = userAttempts
    ? userAttempts.reduce((acc, a) => acc + (a.points_earned || 0), 0)
    : 0;

  const activeDates: string[] = [];
  if (dailyStatsData) {
    for (const entry of dailyStatsData) {
      if ((entry.words_practiced || 0) > 0 || (entry.points || 0) > 0) {
        activeDates.push(entry.date);
      }
    }
  }

  const streak = calculateStreak(activeDates);

  return { totalXp, streak, activeDates };
}
