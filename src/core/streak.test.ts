import { describe, it, expect } from "vitest";
import { calculateStreak } from "./streak";

describe("streak", () => {
  const refToday = "2026-11-07";

  it("returns 0 streak for empty activity", () => {
    const res = calculateStreak([], refToday);
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(0);
    expect(res.hasPracticedToday).toBe(false);
    expect(res.multiplier).toBe(1.0);
  });

  it("returns 1 streak when practiced today only", () => {
    const res = calculateStreak(["2026-11-07"], refToday);
    expect(res.currentStreak).toBe(1);
    expect(res.hasPracticedToday).toBe(true);
    expect(res.multiplier).toBe(1.0);
  });

  it("preserves streak when practiced yesterday but not yet today", () => {
    const res = calculateStreak(["2026-11-06", "2026-11-05"], refToday);
    expect(res.currentStreak).toBe(2);
    expect(res.hasPracticedToday).toBe(false);
    expect(res.streakPreservedYesterday).toBe(true);
  });

  it("increments streak when practiced consecutively including today", () => {
    const res = calculateStreak(
      ["2026-11-07", "2026-11-06", "2026-11-05", "2026-11-04"],
      refToday,
    );
    expect(res.currentStreak).toBe(4);
    expect(res.hasPracticedToday).toBe(true);
    expect(res.multiplier).toBe(1.1); // streak >= 3
  });

  it("resets streak to 0 if yesterday was missed", () => {
    const res = calculateStreak(["2026-11-05", "2026-11-04"], refToday);
    expect(res.currentStreak).toBe(0);
    expect(res.hasPracticedToday).toBe(false);
    expect(res.longestStreak).toBe(2);
  });

  it("calculates correct multiplier at higher tiers", () => {
    const dates = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date("2026-11-07T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    const res = calculateStreak(dates, refToday);
    expect(res.currentStreak).toBe(15);
    expect(res.multiplier).toBe(1.5); // >= 14 days
  });

  it("generates recent 7 days timeline accurately", () => {
    const res = calculateStreak(["2026-11-07", "2026-11-05"], refToday);
    expect(res.recent7Days.length).toBe(7);
    expect(res.recent7Days[6].isToday).toBe(true);
    expect(res.recent7Days[6].practiced).toBe(true);
    expect(res.recent7Days[5].practiced).toBe(false); // yesterday
    expect(res.recent7Days[4].practiced).toBe(true); // 2 days ago
  });
});
