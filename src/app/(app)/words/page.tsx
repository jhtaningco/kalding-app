import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WordsManager } from "./words-manager";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Word Bank | Kalding English",
  description: "Browse and add custom English vocabulary for typing practice.",
};

export default async function WordsPage() {
  const supabase = await createClient();
  const { data: dbWords } = await supabase
    .from("words")
    .select("*")
    .order("word", { ascending: true });

  let words: Tables<"words">[] = dbWords ?? [];

  // If the database has not been seeded yet with live Supabase,
  // load starter words from words.json so learner can browse and test immediately!
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
      // ignore read error
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <WordsManager initialWords={words} />
    </div>
  );
}
