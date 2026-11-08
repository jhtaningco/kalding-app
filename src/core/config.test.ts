import { describe, expect, it } from "vitest";
import { DAILY, POINTS, SRS, STREAK_MULTIPLIERS } from "./config";

describe("core config", () => {
  it("matches the spec defaults", () => {
    expect(POINTS.base).toBe(10);
    expect(POINTS.accuracyBonusMax).toBe(5);
    expect(POINTS.speedBonusMax).toBe(5);
    expect(POINTS.recallBonus).toBe(10);
    expect(DAILY.goalPoints).toBe(100);
    expect(DAILY.newWordsLimit).toBe(10);
  });

  it("keeps streak multipliers sorted from highest threshold to lowest", () => {
    const days = STREAK_MULTIPLIERS.map((s) => s.minDays);
    expect(days).toEqual([...days].sort((a, b) => b - a));
  });

  it("keeps SRS ease bounds consistent", () => {
    expect(SRS.minEase).toBeLessThan(SRS.defaultEase);
    expect(SRS.easePenalty).toBeGreaterThan(0);
  });
});
