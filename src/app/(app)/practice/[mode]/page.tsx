import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PracticeEngine } from "./practice-engine";
import { WordRushEngine } from "@/components/practice/WordRushEngine";
import type { PracticeMode } from "@/components/practice/PromptCard";
import type { Tables } from "@/types/database";

const MODE_CONFIGS: Record<
  string,
  {
    modeKey: PracticeMode;
    name: string;
    description: string;
  }
> = {
  def_to_word: {
    modeKey: "def_to_word",
    name: "Definition → Word",
    description: "Read the definition and type the vocabulary word.",
  },
  "def-to-word": {
    modeKey: "def_to_word",
    name: "Definition → Word",
    description: "Read the definition and type the vocabulary word.",
  },
  fill_blank: {
    modeKey: "fill_blank",
    name: "Fill in the Blank",
    description: "Complete the example sentence with the missing word.",
  },
  "fill-blank": {
    modeKey: "fill_blank",
    name: "Fill in the Blank",
    description: "Complete the example sentence with the missing word.",
  },
  dictation: {
    modeKey: "dictation",
    name: "Audio Dictation",
    description: "Listen to the word pronunciation and type what you hear.",
  },
  speed_run: {
    modeKey: "speed_run",
    name: "Speed Run (WPM)",
    description: "Rapid typing challenge tracking your WPM and accuracy.",
  },
  "speed-run": {
    modeKey: "speed_run",
    name: "Speed Run (WPM)",
    description: "Rapid typing challenge tracking your WPM and accuracy.",
  },
  word_to_def: {
    modeKey: "word_to_def",
    name: "Word → Definition (AI Graded)",
    description: "Explain the word in your own words and receive AI feedback.",
  },
  "word-to-def": {
    modeKey: "word_to_def",
    name: "Word → Definition (AI Graded)",
    description: "Explain the word in your own words and receive AI feedback.",
  },
  type_def: {
    modeKey: "type_def",
    name: "Type the Definition",
    description: "Type out the complete dictionary definition word-for-word.",
  },
  "type-def": {
    modeKey: "type_def",
    name: "Type the Definition",
    description: "Type out the complete dictionary definition word-for-word.",
  },
  sentence_type: {
    modeKey: "sentence_type",
    name: "Sentence Transcription",
    description: "Type out the complete example sentence with punctuation.",
  },
  "sentence-type": {
    modeKey: "sentence_type",
    name: "Sentence Transcription",
    description: "Type out the complete example sentence with punctuation.",
  },
  word_rush: {
    modeKey: "word_rush",
    name: "Word Rush",
    description: "Continuous rapid-fire vocabulary stream. Hit Spacebar to advance!",
  },
  "word-rush": {
    modeKey: "word_rush",
    name: "Word Rush",
    description: "Continuous rapid-fire vocabulary stream. Hit Spacebar to advance!",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string }>;
}): Promise<Metadata> {
  const { mode } = await params;
  const config = MODE_CONFIGS[mode];
  return {
    title: config ? `${config.name} | Kalding English` : "Practice | Kalding English",
    description: config?.description || "Interactive typing practice modes.",
  };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const config = MODE_CONFIGS[mode];

  if (!config) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch starter or user words (25 words for rush, 10 for others)
  const limitCount = config.modeKey === "word_rush" ? 25 : 20;
  const { data: dbWords } = await supabase.from("words").select("*").limit(limitCount);

  let words: Tables<"words">[] = dbWords ?? [];

  // Fallback to words.json if database has not been seeded yet
  if (words.length < 10) {
    try {
      const seedPath = path.resolve(process.cwd(), "supabase/seed/words.json");
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf-8");
        const seedItems = JSON.parse(raw);
        words = seedItems.slice(0, limitCount).map(
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

  // If Word Rush continuous stream mode
  if (config.modeKey === "word_rush") {
    return (
      <WordRushEngine
        words={words}
        initialPoints={initialPoints}
        initialStreak={1}
        userId={user?.id}
      />
    );
  }

  // Standard session modes (10 words)
  const sessionWords = words.slice(0, 10);

  return (
    <PracticeEngine
      words={sessionWords}
      mode={config.modeKey}
      modeName={config.name}
      initialPoints={initialPoints}
      initialStreak={1}
      userId={user?.id}
    />
  );
}
