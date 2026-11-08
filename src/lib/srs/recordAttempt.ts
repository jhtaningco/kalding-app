import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { computeSrsUpdate } from "@/core/srs";

export interface RecordAttemptParams {
  supabase: SupabaseClient<Database>;
  userId: string;
  wordId: string;
  mode: string;
  correct: boolean;
  accuracy: number;
  timeMs: number;
  pointsEarned: number;
  typedText: string;
  usedHint?: boolean;
  language?: string;
}

/**
 * Persists an exercise attempt to `attempts`, computes the updated SRS metrics,
 * upserts `user_words`, and increments `daily_stats`.
 */
export async function recordWordAttempt({
  supabase,
  userId,
  wordId,
  mode,
  correct,
  accuracy,
  timeMs,
  pointsEarned,
  typedText,
  usedHint = false,
  language = "en",
}: RecordAttemptParams) {
  // If running in preview mode without real UUID word IDs (e.g. "seed-0"), skip DB writes
  const isSeedFallback = wordId.startsWith("seed-");
  if (isSeedFallback) {
    return computeSrsUpdate(null, { correct, accuracy, timeMs, usedHint });
  }

  // 1. Insert row into attempts history
  const { error: attemptError } = await supabase.from("attempts").insert({
    user_id: userId,
    word_id: wordId,
    mode,
    correct,
    typed_text: typedText,
    time_ms: timeMs,
    accuracy,
    points_earned: pointsEarned,
    language,
  });

  if (attemptError) {
    console.warn("Failed to record attempt:", attemptError.message);
  }

  // 2. Fetch existing SRS progress for this user + word
  const { data: existingUserWord } = await supabase
    .from("user_words")
    .select("*")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  // 3. Compute updated SRS metrics via pure SM-2 algorithm
  const srsUpdate = computeSrsUpdate(
    existingUserWord,
    {
      correct,
      accuracy,
      timeMs,
      usedHint,
    },
    new Date(),
  );

  // 4. Upsert user_words
  const { error: srsError } = await supabase.from("user_words").upsert(
    {
      user_id: userId,
      word_id: wordId,
      language,
      ease: srsUpdate.ease,
      interval_days: srsUpdate.interval_days,
      streak_correct: srsUpdate.streak_correct,
      times_seen: srsUpdate.times_seen,
      times_correct: srsUpdate.times_correct,
      last_seen_at: srsUpdate.last_seen_at,
      next_review_at: srsUpdate.next_review_at,
    },
    { onConflict: "user_id,word_id" },
  );

  if (srsError) {
    console.warn("Failed to update user_words SRS:", srsError.message);
  }

  // 5. Update daily stats
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: existingDaily } = await supabase
    .from("daily_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("date", todayStr)
    .maybeSingle();

  const newPoints = (existingDaily?.points ?? 0) + pointsEarned;
  const newWordsCount = (existingDaily?.words_practiced ?? 0) + 1;

  await supabase.from("daily_stats").upsert(
    {
      user_id: userId,
      date: todayStr,
      language,
      points: newPoints,
      words_practiced: newWordsCount,
      goal_met: newPoints >= 100,
    },
    { onConflict: "user_id,date" },
  );

  return srsUpdate;
}
