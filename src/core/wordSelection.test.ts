import { describe, it, expect } from "vitest";
import { selectPracticeWords, shuffleArray, type WordItem, type UserWordProgress } from "./wordSelection";

function makeWords(count: number): WordItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `w-${i + 1}`,
    word: `word-${i + 1}`,
    part_of_speech: "noun",
    definition: `Definition for word-${i + 1}`,
    example_sentence: `Example sentence for word-${i + 1}`,
  }));
}

describe("shuffleArray", () => {
  it("shuffles array elements and maintains all items", () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(list, 42);
    expect(shuffled).toHaveLength(list.length);
    expect(shuffled.sort()).toEqual(list.sort());
  });

  it("produces deterministic output with a given seed", () => {
    const list = ["apple", "banana", "cherry", "date", "elderberry"];
    const s1 = shuffleArray(list, 12345);
    const s2 = shuffleArray(list, 12345);
    expect(s1).toEqual(s2);
  });
});

describe("selectPracticeWords", () => {
  const words = makeWords(30);

  it("returns exactly requested count", () => {
    const selected = selectPracticeWords({ words, count: 10, seed: 1 });
    expect(selected).toHaveLength(10);
    // Ensure all returned items are unique
    const ids = new Set(selected.map((w) => w.id));
    expect(ids.size).toBe(10);
  });

  it("prioritizes unseen words when user has only practiced a few words", () => {
    // Suppose user has already practiced w-1 through w-10
    const progress: UserWordProgress[] = words.slice(0, 10).map((w) => ({
      word_id: w.id,
      times_seen: 5,
      next_review_at: "2099-01-01T00:00:00.000Z", // Not due
    }));

    const selected = selectPracticeWords({
      words,
      userProgress: progress,
      count: 10,
      now: new Date("2026-11-09T00:00:00Z"),
      seed: 99,
    });

    // Unseen words (w-11 through w-30) should be heavily prioritized
    const unseenSelected = selected.filter((w) => {
      const idx = parseInt(w.id.replace("w-", ""), 10);
      return idx > 10;
    });
    expect(unseenSelected.length).toBeGreaterThanOrEqual(6);
  });

  it("prioritizes due SRS words when review is ready", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    const progress: UserWordProgress[] = [
      { word_id: "w-1", times_seen: 3, next_review_at: "2026-11-08T00:00:00Z" }, // Due!
      { word_id: "w-2", times_seen: 3, next_review_at: "2026-11-07T00:00:00Z" }, // Due!
      { word_id: "w-3", times_seen: 3, next_review_at: "2026-11-15T00:00:00Z" }, // Not due
    ];

    const selected = selectPracticeWords({
      words,
      userProgress: progress,
      count: 5,
      now,
      seed: 55,
    });

    const selectedIds = selected.map((w) => w.id);
    expect(selectedIds).toContain("w-1");
    expect(selectedIds).toContain("w-2");
  });

  it("rotates words across different sessions instead of always picking the first 10", () => {
    const session1 = selectPracticeWords({ words, count: 10, seed: 101 });
    const session2 = selectPracticeWords({ words, count: 10, seed: 202 });

    const s1Ids = session1.map((w) => w.id).join(",");
    const s2Ids = session2.map((w) => w.id).join(",");
    expect(s1Ids).not.toEqual(s2Ids);
  });
});
