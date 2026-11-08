/**
 * Single source of truth for every tunable number in the app.
 * Pure TypeScript: no React, Next, or browser imports, so the future
 * Expo mobile app can reuse this folder unchanged.
 */

export const DEFAULT_LANGUAGE = "en";

export const POINTS = {
  /** Awarded for every correct answer. */
  base: 10,
  /** Max bonus for typing with no mistakes (scaled by accuracy). */
  accuracyBonusMax: 5,
  /** Max bonus for fast answers (relative to word length). */
  speedBonusMax: 5,
  /** Bonus for correctly recalling a word previously missed. */
  recallBonus: 10,
} as const;

/** Highest matching `minDays` wins. Kept sorted descending. */
export const STREAK_MULTIPLIERS = [
  { minDays: 14, multiplier: 1.5 },
  { minDays: 7, multiplier: 1.25 },
  { minDays: 3, multiplier: 1.1 },
] as const;

export const DAILY = {
  /** Default daily goal, in points. */
  goalPoints: 100,
  /** Default number of brand-new words introduced per day. */
  newWordsLimit: 10,
} as const;

export const SRS = {
  /** Interval after the first correct answer. */
  firstIntervalDays: 1,
  /** Interval after the second correct answer in a row. */
  secondIntervalDays: 3,
  /** Starting ease for a new user-word. */
  defaultEase: 2.5,
  /** Ease never drops below this. */
  minEase: 1.3,
  /** Ease lost on a wrong answer. */
  easePenalty: 0.2,
  /** Interval after a wrong answer. */
  lapseIntervalDays: 1,
} as const;
