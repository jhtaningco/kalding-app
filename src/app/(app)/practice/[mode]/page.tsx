import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PracticeEngine } from "./practice-engine";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Practice: Definition → Word | Kalding English",
  description:
    "Type the word that matches the definition to learn vocabulary and earn points.",
};

export default async function PracticePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch starter or user words (10 words)
  const { data: dbWords } = await supabase.from("words").select("*").limit(20);

  let words: Tables<"words">[] = dbWords ?? [];

  // Fallback to words.json if database has not been seeded yet
  if (words.length < 10) {
    try {
      const seedPath = path.resolve(process.cwd(), "supabase/seed/words.json");
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf-8");
        const seedItems = JSON.parse(raw);
        words = seedItems.slice(0, 10).map(
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

  // Pick up to 10 words for the session
  const sessionWords = words.slice(0, 10);

  // 2. Fetch user's current total points from previous attempts
  let initialPoints = 0;
  if (user) {
    const { data: userAttempts } = await supabase
      .from("attempts")
      .select("points_earned")
      .eq("user_id", user.id);

    if (userAttempts) {
      initialPoints = userAttempts.reduce((acc, a) => acc + (a.points_earned || 0), 0);
    }
  }

  const modeName =
    mode === "def_to_word" || mode === "def-to-word"
      ? "Definition → Word"
      : mode.replace(/[-_]/g, " ");

  return (
    <PracticeEngine
      words={sessionWords}
      modeName={modeName}
      initialPoints={initialPoints}
      initialStreak={1}
      userId={user?.id}
    />
  );
}
