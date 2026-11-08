import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReviewManager, type TrackedWordItem } from "./review-manager";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Review Queue (SRS) | Kalding English",
  description:
    "Spaced repetition review queue to lock vocabulary into long-term memory.",
};

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let trackedWords: TrackedWordItem[] = [];
  let fallbackWords: Tables<"words">[] = [];

  if (user) {
    // 1. Fetch user words with SRS progress joined with words
    const { data: userWordsData } = await supabase
      .from("user_words")
      .select("*, word:words(*)")
      .eq("user_id", user.id)
      .order("next_review_at", { ascending: true });

    if (userWordsData) {
      trackedWords = userWordsData
        .filter((item): item is typeof item & { word: Tables<"words"> } => Boolean(item.word))
        .map((item) => ({
          word: item.word,
          srs: {
            user_id: item.user_id,
            word_id: item.word_id,
            language: item.language,
            ease: item.ease,
            interval_days: item.interval_days,
            next_review_at: item.next_review_at,
            streak_correct: item.streak_correct,
            times_seen: item.times_seen,
            times_correct: item.times_correct,
            last_seen_at: item.last_seen_at,
          },
        }));
    }
  }

  // 2. Fetch starter fallback words from database or seed file
  const { data: dbWords } = await supabase.from("words").select("*").limit(20);
  if (dbWords && dbWords.length > 0) {
    fallbackWords = dbWords;
  } else {
    try {
      const seedPath = path.resolve(process.cwd(), "supabase/seed/words.json");
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf-8");
        const seedItems = JSON.parse(raw);
        fallbackWords = seedItems.slice(0, 15).map(
          (
            item: {
              word: string;
              part_of_speech: string;
              definition: string;
              example_sentence: string;
              level: string;
              language: string;
            },
            idx: number,
          ) => ({
            id: `seed-${idx}`,
            created_at: new Date().toISOString(),
            ...item,
          }),
        );
      }
    } catch {
      // ignore read error
    }
  }

  // 3. Fetch daily points
  let currentPoints = 0;
  if (user) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: dailyData } = await supabase
      .from("daily_stats")
      .select("points")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .maybeSingle();

    if (dailyData?.points) {
      currentPoints = dailyData.points;
    }
  }

  return (
    <ReviewManager
      trackedWords={trackedWords}
      fallbackWords={fallbackWords}
      initialPoints={currentPoints}
      initialStreak={0}
      userId={user?.id}
    />
  );
}
