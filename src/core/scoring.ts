import { POINTS, STREAK_MULTIPLIERS } from "./config";

export type ScoreParams = {
  correct: boolean;
  targetWord: string;
  timeMs: number;
  mistakeCount: number;
  usedHint?: boolean;
  wasMissedPreviously?: boolean;
  streakDays?: number;
};

export type ScoreBreakdown = {
  base: number;
  accuracyBonus: number;
  speedBonus: number;
  recallBonus: number;
  streakMultiplier: number;
  totalPoints: number;
};

/**
 * Calculates the active streak multiplier based on consecutive streak days.
 */
export function getStreakMultiplier(streakDays = 0): number {
  if (streakDays <= 0) return 1.0;
  for (const item of STREAK_MULTIPLIERS) {
    if (streakDays >= item.minDays) {
      return item.multiplier;
    }
  }
  return 1.0;
}

/**
 * Calculates speed bonus (up to +5 points) relative to target word length.
 * Shorter words have less allowance; longer words have more time.
 */
export function calculateSpeedBonus(wordLength: number, timeMs: number): number {
  const len = Math.max(1, wordLength);
  // Base reading time (1200ms) + 380ms per character
  const targetTimeMs = 1200 + len * 380;

  if (timeMs <= targetTimeMs) {
    return POINTS.speedBonusMax; // +5
  }
  if (timeMs <= targetTimeMs * 1.4) {
    return 3;
  }
  if (timeMs <= targetTimeMs * 1.9) {
    return 1;
  }
  return 0;
}

/**
 * Calculates accuracy bonus (up to +5 points) based on mistake count and hint usage.
 */
export function calculateAccuracyBonus(mistakeCount: number, usedHint = false): number {
  if (usedHint) return 0;
  if (mistakeCount === 0) return POINTS.accuracyBonusMax; // +5
  if (mistakeCount === 1) return 2;
  return 0;
}

/**
 * Calculates the complete points earned for an exercise attempt.
 * Pure TypeScript: completely independent of React or Next.js.
 */
export function calculateScore(params: ScoreParams): ScoreBreakdown {
  if (!params.correct) {
    return {
      base: 0,
      accuracyBonus: 0,
      speedBonus: 0,
      recallBonus: 0,
      streakMultiplier: getStreakMultiplier(params.streakDays ?? 0),
      totalPoints: 0,
    };
  }

  const base = POINTS.base; // +10
  const accuracyBonus = calculateAccuracyBonus(
    params.mistakeCount,
    params.usedHint ?? false,
  );
  const speedBonus = calculateSpeedBonus(params.targetWord.length, params.timeMs);
  const recallBonus = params.wasMissedPreviously ? POINTS.recallBonus : 0; // +10

  const streakMultiplier = getStreakMultiplier(params.streakDays ?? 0);

  const subtotal = base + accuracyBonus + speedBonus + recallBonus;
  const totalPoints = Math.round(subtotal * streakMultiplier);

  return {
    base,
    accuracyBonus,
    speedBonus,
    recallBonus,
    streakMultiplier,
    totalPoints,
  };
}
