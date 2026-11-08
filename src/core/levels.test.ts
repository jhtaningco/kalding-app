import { describe, it, expect } from "vitest";
import { calculateLevel, checkLevelUp } from "./levels";

describe("levels", () => {
  it("starts at level 1 with 0 XP", () => {
    const info = calculateLevel(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("Novice Kid");
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpNeededForNextLevel).toBe(100);
    expect(info.progressPercent).toBe(0);
  });

  it("calculates partial progress within level 1", () => {
    const info = calculateLevel(45);
    expect(info.level).toBe(1);
    expect(info.currentLevelXp).toBe(45);
    expect(info.progressPercent).toBe(45);
  });

  it("advances to level 2 at 100 XP", () => {
    const info = calculateLevel(100);
    expect(info.level).toBe(2);
    expect(info.title).toBe("Curious Kid");
    expect(info.currentLevelXp).toBe(0);
    expect(info.xpNeededForNextLevel).toBe(150); // 250 - 100
  });

  it("scales up into higher levels", () => {
    const info = calculateLevel(1000);
    expect(info.level).toBe(6);
    expect(info.title).toBe("Mountain Climber");
  });

  it("detects level up between previous and new XP", () => {
    const result1 = checkLevelUp(90, 110);
    expect(result1.leveledUp).toBe(true);
    expect(result1.oldLevel).toBe(1);
    expect(result1.newLevel).toBe(2);

    const result2 = checkLevelUp(110, 130);
    expect(result2.leveledUp).toBe(false);
  });
});
