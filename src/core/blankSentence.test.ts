import { describe, it, expect } from "vitest";
import { blankWordInSentence } from "./blankSentence";

describe("blankSentence", () => {
  it("replaces exact word with blank placeholder", () => {
    const res = blankWordInSentence(
      "The tenacious goat climbed the steep mountain.",
      "tenacious",
    );
    expect(res.matched).toBe(true);
    expect(res.blankedSentence).toBe(
      "The ________ goat climbed the steep mountain.",
    );
  });

  it("handles case-insensitivity at sentence beginning", () => {
    const res = blankWordInSentence(
      "Tenacious climbers never give up.",
      "tenacious",
    );
    expect(res.matched).toBe(true);
    expect(res.blankedSentence).toBe("________ climbers never give up.");
  });

  it("preserves punctuation surrounding the target word", () => {
    const res = blankWordInSentence(
      "Kalding is truly resilient!",
      "resilient",
    );
    expect(res.matched).toBe(true);
    expect(res.blankedSentence).toBe("Kalding is truly ________!");
  });

  it("matches common plural or past inflections", () => {
    const res1 = blankWordInSentence(
      "The goats wandered through the valley.",
      "wander",
    );
    expect(res1.matched).toBe(true);
    expect(res1.blankedSentence).toBe("The goats ________ through the valley.");

    const res2 = blankWordInSentence(
      "She loves wandering in nature.",
      "wander",
    );
    expect(res2.matched).toBe(true);
    expect(res2.blankedSentence).toBe("She loves ________ in nature.");
  });

  it("handles drop-e inflections like drive -> driving", () => {
    const res = blankWordInSentence(
      "He was thriving in his new environment.",
      "thrive",
    );
    expect(res.matched).toBe(true);
    expect(res.blankedSentence).toBe(
      "He was ________ in his new environment.",
    );
  });

  it("falls back gracefully when word is not in sentence", () => {
    const res = blankWordInSentence(
      "The sun shone brightly today.",
      "serendipity",
    );
    expect(res.matched).toBe(false);
    expect(res.blankedSentence).toContain("[________]");
  });
});
