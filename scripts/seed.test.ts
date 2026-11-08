import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { seedWords } from "./seed-words";

describe("seed data and script", () => {
  it("has at least 150 starter words in words.json with valid structure", () => {
    const seedPath = path.resolve(process.cwd(), "supabase/seed/words.json");
    expect(fs.existsSync(seedPath)).toBe(true);

    const raw = fs.readFileSync(seedPath, "utf-8");
    const words = JSON.parse(raw);

    expect(Array.isArray(words)).toBe(true);
    expect(words.length).toBeGreaterThanOrEqual(150);

    const uniqueWords = new Set<string>();

    for (const item of words) {
      expect(typeof item.word).toBe("string");
      expect(item.word.trim().length).toBeGreaterThan(0);
      expect(typeof item.part_of_speech).toBe("string");
      expect(typeof item.definition).toBe("string");
      expect(item.definition.trim().length).toBeGreaterThan(5);
      expect(typeof item.example_sentence).toBe("string");
      expect(item.language).toBe("en");
      expect(["beginner", "intermediate", "advanced"]).toContain(item.level);

      uniqueWords.add(item.word.toLowerCase());
    }

    // Verify no duplicate words in starter set
    expect(uniqueWords.size).toBe(words.length);
  });

  it("dry-run of seedWords works without database network call", async () => {
    const result = await seedWords({ dryRun: true });
    expect(result.count).toBeGreaterThanOrEqual(150);
    expect(result.inserted).toBe(result.count);
  });
});
