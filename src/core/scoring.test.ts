import { describe, expect, it } from "vitest";
import {
  calculateAccuracyBonus,
  calculateScore,
  calculateSpeedBonus,
  getStreakMultiplier,
} from "./scoring";

describe("scoring core logic", () => {
  it("determines streak multiplier correctly", () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
    expect(getStreakMultiplier(2)).toBe(1.0);
    expect(getStreakMultiplier(3)).toBe(1.1);
    expect(getStreakMultiplier(6)).toBe(1.1);
    expect(getStreakMultiplier(7)).toBe(1.25);
    expect(getStreakMultiplier(13)).toBe(1.25);
    expect(getStreakMultiplier(14)).toBe(1.5);
    expect(getStreakMultiplier(30)).toBe(1.5);
  });

  it("calculates accuracy bonus based on mistakes and hint", () => {
    expect(calculateAccuracyBonus(0, false)).toBe(5);
    expect(calculateAccuracyBonus(1, false)).toBe(2);
    expect(calculateAccuracyBonus(2, false)).toBe(0);
    expect(calculateAccuracyBonus(0, true)).toBe(0); // Hint zeroes out accuracy bonus
  });

  it("calculates speed bonus scaling with word length", () => {
    // 4-letter word target time: 1200 + 4 * 380 = 2720ms
    expect(calculateSpeedBonus(4, 2000)).toBe(5);
    expect(calculateSpeedBonus(4, 3500)).toBe(3);
    expect(calculateSpeedBonus(4, 4500)).toBe(1);
    expect(calculateSpeedBonus(4, 10000)).toBe(0);
  });

  it("awards 0 points for incorrect answers", () => {
    const score = calculateScore({
      correct: false,
      targetWord: "resilient",
      timeMs: 1500,
      mistakeCount: 0,
      streakDays: 7,
    });
    expect(score.totalPoints).toBe(0);
    expect(score.base).toBe(0);
  });

  it("awards base + bonuses + multiplier for a perfect answer", () => {
    const score = calculateScore({
      correct: true,
      targetWord: "brave",
      timeMs: 1500,
      mistakeCount: 0,
      streakDays: 7, // x1.25
    });

    // base 10 + accuracy 5 + speed 5 = 20 * 1.25 = 25
    expect(score.base).toBe(10);
    expect(score.accuracyBonus).toBe(5);
    expect(score.speedBonus).toBe(5);
    expect(score.recallBonus).toBe(0);
    expect(score.streakMultiplier).toBe(1.25);
    expect(score.totalPoints).toBe(25);
  });

  it("includes recall bonus when recalling a previously missed word", () => {
    const score = calculateScore({
      correct: true,
      targetWord: "resilient",
      timeMs: 2000,
      mistakeCount: 0,
      wasMissedPreviously: true,
      streakDays: 0,
    });

    // base 10 + accuracy 5 + speed 5 + recall 10 = 30 * 1.0 = 30
    expect(score.recallBonus).toBe(10);
    expect(score.totalPoints).toBe(30);
  });
});
