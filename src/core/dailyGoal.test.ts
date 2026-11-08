import { describe, it, expect } from "vitest";
import { calculateDailyGoalProgress } from "./dailyGoal";

describe("dailyGoal", () => {
  it("calculates 0% progress at start of day", () => {
    const res = calculateDailyGoalProgress(0, 100);
    expect(res.percent).toBe(0);
    expect(res.pointsRemaining).toBe(100);
    expect(res.isGoalMet).toBe(false);
    expect(res.cheerMessage).toContain("Ready for today's practice");
  });

  it("calculates partial progress accurately", () => {
    const res = calculateDailyGoalProgress(45, 100);
    expect(res.percent).toBe(45);
    expect(res.pointsRemaining).toBe(55);
    expect(res.isGoalMet).toBe(false);
  });

  it("marks goal met when points equal or exceed target", () => {
    const res = calculateDailyGoalProgress(100, 100);
    expect(res.percent).toBe(100);
    expect(res.pointsRemaining).toBe(0);
    expect(res.isGoalMet).toBe(true);
    expect(res.cheerMessage).toContain("Daily goal achieved");
  });

  it("handles exceeded goal with rawPercent over 100", () => {
    const res = calculateDailyGoalProgress(210, 100);
    expect(res.percent).toBe(100);
    expect(res.rawPercent).toBe(210);
    expect(res.isGoalMet).toBe(true);
    expect(res.cheerMessage).toContain("doubled your daily goal");
  });
});
