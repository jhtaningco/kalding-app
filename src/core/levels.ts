/**
 * Pure TypeScript level and XP progression system.
 * No React, Next.js, or browser dependencies.
 */

export interface LevelInfo {
  level: number;
  title: string;
  totalXp: number;
  currentLevelXp: number;
  xpNeededForNextLevel: number;
  progressPercent: number; // 0 to 100
}

const LEVEL_TITLES = [
  "Novice Kid", // 1
  "Curious Kid", // 2
  "Grass Grazer", // 3
  "Trail Scout", // 4
  "Meadow Master", // 5
  "Mountain Climber", // 6
  "Cliff Hopper", // 7
  "Alpine Champion", // 8
  "Highland Chief", // 9
  "Summit Legend", // 10
  "Grand Kalding", // 11+
];

/**
 * Returns the cumulative XP required to reach a specific level.
 * Level 1 starts at 0 XP.
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 450;
  if (level === 5) return 700;
  if (level === 6) return 1000;
  if (level === 7) return 1400;
  if (level === 8) return 1900;
  if (level === 9) return 2500;
  if (level === 10) return 3200;

  // Level 11+: exponential curve
  const extraLevels = level - 10;
  return 3200 + Math.round(extraLevels * 800 + Math.pow(extraLevels, 1.4) * 300);
}

/**
 * Calculates level details for a given total XP.
 */
export function calculateLevel(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.round(totalXp));

  let level = 1;
  while (safeXp >= getCumulativeXpForLevel(level + 1)) {
    level += 1;
  }

  const currentLevelFloor = getCumulativeXpForLevel(level);
  const nextLevelCeiling = getCumulativeXpForLevel(level + 1);

  const currentLevelXp = safeXp - currentLevelFloor;
  const xpNeededForNextLevel = nextLevelCeiling - currentLevelFloor;
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round((currentLevelXp / Math.max(1, xpNeededForNextLevel)) * 100),
    ),
  );

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    title,
    totalXp: safeXp,
    currentLevelXp,
    xpNeededForNextLevel,
    progressPercent,
  };
}

/**
 * Checks whether an XP gain caused a level up.
 */
export function checkLevelUp(
  previousXp: number,
  newXp: number,
): { leveledUp: boolean; oldLevel: number; newLevel: number; newTitle: string } {
  const oldInfo = calculateLevel(previousXp);
  const newInfo = calculateLevel(newXp);

  return {
    leveledUp: newInfo.level > oldInfo.level,
    oldLevel: oldInfo.level,
    newLevel: newInfo.level,
    newTitle: newInfo.title,
  };
}
