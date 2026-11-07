import { SRS } from "./config";

export interface SrsWordRecord {
  ease?: number | null;
  interval_days?: number | null;
  streak_correct?: number | null;
  times_seen?: number | null;
  times_correct?: number | null;
  last_seen_at?: string | null;
  next_review_at?: string | null;
}

export interface SrsAttemptInput {
  correct: boolean;
  accuracy?: number; // 0..1 or 0..100
  timeMs?: number;
  usedHint?: boolean;
}

export type MasteryStage = "new" | "learning" | "reviewing" | "mastered";

export interface SrsUpdateResult {
  ease: number;
  interval_days: number;
  streak_correct: number;
  times_seen: number;
  times_correct: number;
  last_seen_at: string;
  next_review_at: string;
  stage: MasteryStage;
}

/**
 * Normalizes accuracy input into a 0..1 float range.
 */
function normalizeAccuracy(accuracy?: number): number {
  if (accuracy === undefined || accuracy === null || Number.isNaN(accuracy)) {
    return 1;
  }
  return accuracy > 1 ? Math.min(1, accuracy / 100) : Math.max(0, accuracy);
}

/**
 * Calculates a SuperMemo-style quality rating (0 to 5) from performance.
 */
export function calculateQualityRating(attempt: SrsAttemptInput): number {
  if (!attempt.correct) {
    const acc = normalizeAccuracy(attempt.accuracy);
    if (acc >= 0.5) return 2;
    if (acc >= 0.2) return 1;
    return 0;
  }

  // Correct answer
  if (attempt.usedHint) {
    return 3; // Correct with assistance
  }

  const acc = normalizeAccuracy(attempt.accuracy);
  const isFast = attempt.timeMs !== undefined ? attempt.timeMs <= 7000 : true;

  if (acc >= 0.95 && isFast) {
    return 5; // Perfect response
  }
  if (acc >= 0.8) {
    return 4; // Good response with minor hesitation/backspace
  }
  return 3; // Correct after noticeable struggle
}

/**
 * Returns the mastery stage based on interval and times seen.
 */
export function getMasteryStage(
  intervalDays: number | null | undefined,
  timesSeen: number | null | undefined,
): MasteryStage {
  const seen = timesSeen ?? 0;
  const interval = intervalDays ?? 0;

  if (seen === 0) return "new";
  if (interval < 1) return "learning";
  if (interval < 7) return "reviewing";
  return "mastered";
}

/**
 * Determines whether a word is currently due for review against a reference date.
 */
export function isDueForReview(
  nextReviewAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!nextReviewAt) return true;
  const reviewTime = new Date(nextReviewAt).getTime();
  if (Number.isNaN(reviewTime)) return true;
  return reviewTime <= now.getTime();
}

/**
 * Computes updated SRS metrics for a word given an attempt and optional previous record.
 */
export function computeSrsUpdate(
  record: SrsWordRecord | null | undefined,
  attempt: SrsAttemptInput,
  now: Date = new Date(),
): SrsUpdateResult {
  const timesSeen = (record?.times_seen ?? 0) + 1;
  const currentEase = record?.ease ?? SRS.defaultEase;
  const currentStreak = record?.streak_correct ?? 0;
  const timesCorrect = record?.times_correct ?? 0;
  const prevInterval = record?.interval_days ?? 0;

  let newStreak = 0;
  let newTimesCorrect = timesCorrect;
  let nextInterval = 0;
  let newEase = currentEase;

  const quality = calculateQualityRating(attempt);

  if (attempt.correct) {
    newStreak = currentStreak + 1;
    newTimesCorrect = timesCorrect + 1;

    if (newStreak === 1) {
      nextInterval = SRS.firstIntervalDays;
    } else if (newStreak === 2) {
      nextInterval = SRS.secondIntervalDays;
    } else {
      const baseInterval = prevInterval > 0 ? prevInterval : SRS.secondIntervalDays;
      nextInterval = Math.max(
        SRS.secondIntervalDays + 1,
        Math.round(baseInterval * currentEase),
      );
    }

    // SM-2 Ease factor adjustment
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const deltaEase = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    newEase = Math.max(SRS.minEase, Math.round((currentEase + deltaEase) * 100) / 100);
  } else {
    newStreak = 0;
    nextInterval = SRS.lapseIntervalDays;
    newEase = Math.max(SRS.minEase, Math.round((currentEase - SRS.easePenalty) * 100) / 100);
  }

  // Next review date in UTC
  const nextReviewDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    ease: newEase,
    interval_days: nextInterval,
    streak_correct: newStreak,
    times_seen: timesSeen,
    times_correct: newTimesCorrect,
    last_seen_at: now.toISOString(),
    next_review_at: nextReviewDate.toISOString(),
    stage: getMasteryStage(nextInterval, timesSeen),
  };
}

/**
 * Sorts a collection of word items for a review session:
 * 1. Due words (earliest review date first)
 * 2. Words in 'learning' stage (interval 0)
 * 3. Brand-new unattempted words
 */
export function sortWordsForReview<
  T extends {
    next_review_at?: string | null;
    interval_days?: number | null;
    times_seen?: number | null;
  },
>(words: T[], now: Date = new Date()): T[] {
  return [...words].sort((a, b) => {
    const aDue = isDueForReview(a.next_review_at, now);
    const bDue = isDueForReview(b.next_review_at, now);

    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // Both are due or both are not due: sort by next_review_at ascending
    const aTime = a.next_review_at ? new Date(a.next_review_at).getTime() : 0;
    const bTime = b.next_review_at ? new Date(b.next_review_at).getTime() : 0;

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // Tie-break: lowest streak first
    return (a.interval_days ?? 0) - (b.interval_days ?? 0);
  });
}
