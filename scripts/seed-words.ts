import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

/**
 * Loads environment variables from .env.local if present.
 */
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

export async function seedWords(options?: { dryRun?: boolean }) {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const seedFilePath = path.resolve(process.cwd(), "supabase/seed/words.json");
  if (!fs.existsSync(seedFilePath)) {
    throw new Error(`Seed file not found at ${seedFilePath}`);
  }

  const rawData = fs.readFileSync(seedFilePath, "utf-8");
  const words: Array<{
    word: string;
    part_of_speech: string;
    definition: string;
    example_sentence: string;
    level: string;
    language: string;
  }> = JSON.parse(rawData);

  console.log(`\n🐐 Kalding Seed: Found ${words.length} words in words.json`);

  if (options?.dryRun) {
    console.log("✓ Dry-run completed successfully (no network calls).");
    return { count: words.length, inserted: words.length };
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "\n⚠️  Cannot seed database: NEXT_PUBLIC_SUPABASE_URL and either " +
        "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local\n",
    );
    return { count: words.length, inserted: 0 };
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  console.log(`Connecting to ${supabaseUrl}...`);

  // Batch in chunks of 50
  const CHUNK_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("words")
      .upsert(chunk, { onConflict: "word,language" })
      .select("id");

    if (error) {
      console.error(`Failed to seed batch ${i + 1}-${i + chunk.length}:`, error.message);
      throw error;
    }

    inserted += data?.length ?? chunk.length;
    console.log(`  ✓ Synced words ${i + 1} to ${Math.min(i + CHUNK_SIZE, words.length)}`);
  }

  console.log(`\n🎉 Successfully seeded ${inserted} words into Supabase!\n`);
  return { count: words.length, inserted };
}

// When executed directly from CLI
if (
  process.argv[1] &&
  (process.argv[1].endsWith("seed-words.ts") || process.argv[1].endsWith("seed-words.js"))
) {
  seedWords().catch((err) => {
    console.error("Fatal seed error:", err);
    process.exit(1);
  });
}
