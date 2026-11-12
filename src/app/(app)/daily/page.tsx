import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDailyWordDateKey, getWordOfTheDay } from "@/core/dailyWord";
import { DailyWordEngine } from "@/components/daily/DailyWordEngine";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Vocabulary of the Day | Kalding English",
  description:
    "Focus on today's single vocabulary word with spelling, definition typing, and sentence creation.",
};

export default async function DailyWordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch starter words (deterministically ordered)
  const { data: dbWords } = await supabase
    .from("words")
    .select("*")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  let words: Tables<"words">[] = dbWords ?? [];

  if (words.length === 0) {
    try {
      const seedPath = path.resolve(process.cwd(), "supabase/seed/words.json");
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf-8");
        const seedItems = JSON.parse(raw);
        words = seedItems.map(
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
      // ignore
    }
  }

  const dateKey = getDailyWordDateKey(new Date());
  const dailyWord = getWordOfTheDay(words, dateKey);

  if (!dailyWord) {
    notFound();
  }

  // 2. Fetch user points & completion status for today
  let initialPoints = 0;
  let isCompletedToday = false;

  if (user) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [{ data: userAttempts }, { data: todayDailyAttempts }] = await Promise.all([
      supabase.from("attempts").select("points_earned").eq("user_id", user.id),
      supabase
        .from("attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("mode", "daily_word")
        .gte("created_at", todayStart.toISOString()),
    ]);

    if (userAttempts) {
      initialPoints = userAttempts.reduce((acc, a) => acc + (a.points_earned || 0), 0);
    }
    isCompletedToday = (todayDailyAttempts?.length ?? 0) > 0;
  }

  return (
    <DailyWordEngine
      word={dailyWord}
      dateKey={dateKey}
      initialCompleted={isCompletedToday}
      initialPoints={initialPoints}
      initialStreak={1}
      userId={user?.id}
    />
  );
}
