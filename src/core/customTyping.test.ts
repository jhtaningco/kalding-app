import { describe, expect, it } from "vitest";
import {
  calculateCustomTextScore,
  getCustomTextStats,
  normalizeCustomText,
  PRESET_CUSTOM_TEXTS,
} from "./customTyping";

describe("normalizeCustomText", () => {
  it("normalizes smart quotes and apostrophes to standard quotes", () => {
    const raw = `“Hello ‘world’!”`;
    const normalized = normalizeCustomText(raw);
    expect(normalized).toBe(`"Hello 'world'!"`);
  });

  it("normalizes em-dashes and en-dashes", () => {
    const raw = `Life—or something like it – isn't easy.`;
    const normalized = normalizeCustomText(raw);
    expect(normalized).toBe(`Life--or something like it - isn't easy.`);
  });

  it("normalizes newlines and consecutive whitespace to single spaces", () => {
    const raw = "Paragraph one.\n\nParagraph   two.\r\n   Paragraph three.";
    const normalized = normalizeCustomText(raw);
    expect(normalized).toBe("Paragraph one. Paragraph two. Paragraph three.");
  });

  it("handles non-breaking spaces and ellipses", () => {
    const raw = "Wait…\u00A0Kalding is here.";
    const normalized = normalizeCustomText(raw);
    expect(normalized).toBe("Wait... Kalding is here.");
  });

  it("handles empty or whitespace-only strings gracefully", () => {
    expect(normalizeCustomText("")).toBe("");
    expect(normalizeCustomText("   \n\t  ")).toBe("");
  });
});

describe("getCustomTextStats", () => {
  it("returns zero metrics for empty string", () => {
    const stats = getCustomTextStats("");
    expect(stats.charCount).toBe(0);
    expect(stats.wordCount).toBe(0);
    expect(stats.estimatedSeconds).toBe(0);
  });

  it("calculates accurate word and character counts", () => {
    const text = "The quick brown fox jumps over the lazy dog.";
    const stats = getCustomTextStats(text);
    expect(stats.charCount).toBe(text.length);
    expect(stats.wordCount).toBe(9);
    expect(stats.estimatedSeconds).toBeGreaterThan(0);
  });
});

describe("calculateCustomTextScore", () => {
  it("calculates base points according to word count", () => {
    const score = calculateCustomTextScore({
      wordCount: 20,
      accuracy: 75,
      netWpm: 15,
      streakDays: 0,
    });
    // 20 * 1.5 = 30 base, 0 accuracy bonus, 0 speed bonus
    expect(score.basePoints).toBe(30);
    expect(score.accuracyBonus).toBe(0);
    expect(score.speedBonus).toBe(0);
    expect(score.streakMultiplier).toBe(1.0);
    expect(score.totalPoints).toBe(30);
  });

  it("awards high accuracy and high speed bonuses", () => {
    const score = calculateCustomTextScore({
      wordCount: 40,
      accuracy: 99,
      netWpm: 75,
      streakDays: 0,
    });
    // 40 * 1.5 = 60 base
    // accuracy 99 >= 98 -> +25
    // speed 75 >= 70 -> +25
    // subtotal = 110
    expect(score.basePoints).toBe(60);
    expect(score.accuracyBonus).toBe(25);
    expect(score.speedBonus).toBe(25);
    expect(score.totalPoints).toBe(110);
  });

  it("applies streak multiplier correctly", () => {
    const score = calculateCustomTextScore({
      wordCount: 40,
      accuracy: 99,
      netWpm: 75,
      streakDays: 7, // 7 days -> 1.25x streak multiplier
    });
    expect(score.streakMultiplier).toBe(1.25);
    // 110 * 1.25 = 137.5 -> rounded = 138
    expect(score.totalPoints).toBe(138);
  });

  it("respects minimum base points for very short texts", () => {
    const score = calculateCustomTextScore({
      wordCount: 2,
      accuracy: 90,
      netWpm: 25,
    });
    expect(score.basePoints).toBe(10);
    expect(score.accuracyBonus).toBe(10);
    expect(score.speedBonus).toBe(5);
    expect(score.totalPoints).toBe(25);
  });
});

describe("PRESET_CUSTOM_TEXTS", () => {
  it("provides valid presets with texts and titles", () => {
    expect(PRESET_CUSTOM_TEXTS.length).toBeGreaterThanOrEqual(4);
    for (const preset of PRESET_CUSTOM_TEXTS) {
      expect(preset.id).toBeTruthy();
      expect(preset.title).toBeTruthy();
      expect(preset.text.length).toBeGreaterThan(20);
    }
  });
});
