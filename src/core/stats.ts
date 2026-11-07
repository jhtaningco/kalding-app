/**
 * Pure TypeScript user statistics and analytics calculation.
 * No React, Next.js, or browser dependencies.
 */

export interface AttemptSummary {
  correct: boolean;
  accuracy: number;
  time_ms: number;
  word_id: string;
}

export interface WeakWordStat {
  wordId: string;
  totalAttempts: number;
  mistakes: number;
  errorRate: number; // 0 to 1
  accuracy: number; // 0 to 100
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon, etc.
  dayName: string;
  practiced: boolean;
  isToday: boolean;
}

/**
 * Computes average accuracy across an array of attempts.
 */
export function calculateOverallAccuracy(
  attempts: { accuracy?: number | null; correct?: boolean }[],
): number {
  if (attempts.length === 0) return 100;

  let totalAcc = 0;
  for (const a of attempts) {
    if (a.accuracy !== undefined && a.accuracy !== null) {
      const normalized = a.accuracy > 1 ? a.accuracy : a.accuracy * 100;
      totalAcc += normalized;
    } else {
      totalAcc += a.correct ? 100 : 0;
    }
  }

  return Math.round(totalAcc / attempts.length);
}

/**
 * Formats elapsed milliseconds into human readable duration (e.g. "1h 12m" or "4m 20s").
 */
export function formatPracticeDuration(totalMs: number): string {
  if (totalMs <= 0) return "0s";

  const totalSeconds = Math.round(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Identifies the learner's weakest words by calculating mistake rates and failure frequencies.
 */
export function identifyWeakestWords(
  attempts: { word_id: string; correct: boolean; accuracy?: number | null }[],
  limit: number = 5,
): WeakWordStat[] {
  if (attempts.length === 0) return [];

  const wordMap = new Map<
    string,
    { wordId: string; total: number; wrong: number; accSum: number }
  >();

  for (const a of attempts) {
    const existing = wordMap.get(a.word_id) || {
      wordId: a.word_id,
      total: 0,
      wrong: 0,
      accSum: 0,
    };
    existing.total += 1;
    if (!a.correct) {
      existing.wrong += 1;
    }
    const acc =
      a.accuracy !== undefined && a.accuracy !== null
        ? a.accuracy > 1
          ? a.accuracy
          : a.accuracy * 100
        : a.correct
          ? 100
          : 0;
    existing.accSum += acc;
    wordMap.set(a.word_id, existing);
  }

  // Filter to words with at least 1 mistake or low accuracy
  const stats: WeakWordStat[] = Array.from(wordMap.values()).map((entry) => {
    const errorRate = entry.total > 0 ? entry.wrong / entry.total : 0;
    const accuracy = entry.total > 0 ? Math.round(entry.accSum / entry.total) : 100;
    return {
      wordId: entry.wordId,
      totalAttempts: entry.total,
      mistakes: entry.wrong,
      errorRate,
      accuracy,
    };
  });

  // Sort by highest error rate first, then total mistakes descending
  stats.sort((a, b) => {
    if (b.errorRate !== a.errorRate) {
      return b.errorRate - a.errorRate;
    }
    return b.mistakes - a.mistakes;
  });

  return stats.slice(0, limit);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Generates 30-day activity calendar heatmap.
 */
export function generate30DayHeatmap(
  activeDates: string[],
  referenceDateStr?: string,
): HeatmapDay[] {
  const ref = referenceDateStr
    ? new Date(referenceDateStr + "T00:00:00Z")
    : new Date();
  const dateSet = new Set(activeDates.map((d) => d.slice(0, 10)));
  const days: HeatmapDay[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(ref.getTime());
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getUTCDay();

    days.push({
      date: dateStr,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      practiced: dateSet.has(dateStr),
      isToday: i === 0,
    });
  }

  return days;
}
