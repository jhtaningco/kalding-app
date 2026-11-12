import { describe, it, expect } from "vitest";
import {
  getDailyWordIndex,
  getWordOfTheDay,
  validateUserSentence,
  type SentenceValidationResult,
} from "./dailyWord";
import type { WordItem } from "./wordSelection";

const sampleWords: WordItem[] = [
  {
    id: "1",
    word: "abundant",
    part_of_speech: "adj",
    definition: "existing in large amounts",
  },
  {
    id: "2",
    word: "clarity",
    part_of_speech: "noun",
    definition: "the state of being clear",
  },
  {
    id: "3",
    word: "diligent",
    part_of_speech: "adj",
    definition: "showing steady care and effort",
  },
  {
    id: "4",
    word: "eloquent",
    part_of_speech: "adj",
    definition: "fluent or persuasive in speaking",
  },
  {
    id: "5",
    word: "feasible",
    part_of_speech: "adj",
    definition: "possible to do easily",
  },
];

describe("dailyWord engine", () => {
  it("computes deterministic index based on date string", () => {
    const idx1 = getDailyWordIndex("2026-11-09", sampleWords.length);
    const idx2 = getDailyWordIndex("2026-11-09", sampleWords.length);
    expect(idx1).toBe(idx2);
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeLessThan(sampleWords.length);
  });

  it("advances to a different index on consecutive days", () => {
    const idxDay1 = getDailyWordIndex("2026-11-09", sampleWords.length);
    const idxDay2 = getDailyWordIndex("2026-11-10", sampleWords.length);
    const idxDay3 = getDailyWordIndex("2026-11-11", sampleWords.length);

    expect(idxDay1).not.toBe(idxDay2);
    expect(idxDay2).not.toBe(idxDay3);
  });

  it("selects correct WordItem for the day", () => {
    const word = getWordOfTheDay(sampleWords, "2026-11-09");
    expect(word).not.toBeNull();
    expect(sampleWords).toContain(word);
  });

  it("maintains stable word of the day when new words are added to library", () => {
    // Generate a core library of 150 words
    const coreWords: WordItem[] = Array.from({ length: 150 }, (_, i) => ({
      id: `core-${i}`,
      word: `word-${i}`,
      part_of_speech: "noun",
      definition: `definition for word ${i}`,
    }));

    const wordBefore = getWordOfTheDay(coreWords, "2026-11-12");

    // Simulate user adding custom words (e.g. 5 new words appended)
    const expandedWords: WordItem[] = [
      ...coreWords,
      {
        id: "custom-150",
        word: "meticulous",
        part_of_speech: "adj",
        definition: "careful",
      },
      {
        id: "custom-151",
        word: "serendipity",
        part_of_speech: "noun",
        definition: "happy chance",
      },
      { id: "custom-152", word: "lucid", part_of_speech: "adj", definition: "clear" },
    ];

    const wordAfter = getWordOfTheDay(expandedWords, "2026-11-12");

    // The Word of the Day MUST be completely identical!
    expect(wordAfter).not.toBeNull();
    expect(wordAfter?.id).toBe(wordBefore?.id);
    expect(wordAfter?.word).toBe(wordBefore?.word);
  });
});

describe("validateUserSentence", () => {
  it("rejects empty sentence", () => {
    const res = validateUserSentence("", "abundant");
    expect(res.isValid).toBe(false);
  });

  it("rejects sentences that are too short", () => {
    const res = validateUserSentence("Very abundant.", "abundant");
    expect(res.isValid).toBe(false);
    expect(res.wordCount).toBe(2);
  });

  it("rejects sentences without the target word", () => {
    const res = validateUserSentence("The weather today is warm and sunny.", "abundant");
    expect(res.isValid).toBe(false);
    expect(res.hasTargetWord).toBe(false);
  });

  it("rejects sentences missing closing punctuation", () => {
    const res = validateUserSentence(
      "There was an abundant supply of fresh fruit",
      "abundant",
    );
    expect(res.isValid).toBe(false);
    expect(res.hasPunctuation).toBe(false);
  });

  it("accepts valid, well-formed sentence using target word", () => {
    const res: SentenceValidationResult = validateUserSentence(
      "The garden provided an abundant harvest of ripe tomatoes.",
      "abundant",
    );
    expect(res.isValid).toBe(true);
    expect(res.hasTargetWord).toBe(true);
    expect(res.hasPunctuation).toBe(true);
  });

  it("accepts inflected forms of target word (e.g. dilly/diligently)", () => {
    const res = validateUserSentence(
      "She worked diligently every day to achieve her goals.",
      "diligent",
    );
    expect(res.isValid).toBe(true);
  });
});
