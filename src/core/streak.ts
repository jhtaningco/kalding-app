/**
 * Pure TypeScript streak calculation engine.
 * No React, Next.js, or browser dependencies.
 */

import { STREAK_MULTIPLIERS } from "./config";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  hasPracticedToday: boolean;
  streakPreservedYesterday: boolean;
  multiplier: number;
  recent7Days: {
    date: string; // YYYY-MM-DD
    dayName: string; // e.g. "Mon", "Tue"
    practiced: boolean;
    isToday: boolean;
  }[];
}

/**
 * Returns formatted YYYY-MM-DD string for a Date in UTC.
 */
function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Adds offset days to a given YYYY-MM-DD string.
 */
function addDays(dateStr: string, offset: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return toDateString(d);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Computes learner streak metrics given active practice dates.
 * Dates are expected in YYYY-MM-DD format.
 */
export function calculateStreak(
  activeDates: string[],
  referenceDateStr?: string,
): StreakResult {
  const today = referenceDateStr ?? toDateString(new Date());
  const yesterday = addDays(today, -1);

  // Deduplicate and sort dates descending
  const dateSet = new Set(activeDates.map((d) => d.slice(0, 10)));

  const hasPracticedToday = dateSet.has(today);
  const streakPreservedYesterday = dateSet.has(yesterday);

  // 1. Current streak calculation
  let currentStreak = 0;
  let checkDate = hasPracticedToday ? today : yesterday;

  if (dateSet.has(checkDate)) {
    while (dateSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = addDays(checkDate, -1);
    }
  }

  // 2. Longest streak in history
  const sortedDates = Array.from(dateSet).sort(); // ascending
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: string | null = null;

  for (const date of sortedDates) {
    if (prevDate && addDays(prevDate, 1) === date) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }
    prevDate = date;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  // 3. Multiplier from config
  let multiplier = 1.0;
  for (const item of STREAK_MULTIPLIERS) {
    if (currentStreak >= item.minDays) {
      multiplier = item.multiplier;
      break;
    }
  }

  // 4. Last 7 days overview (from 6 days ago up to today)
  const recent7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStr = addDays(today, -i);
    const dayDate = new Date(dayStr + "T00:00:00Z");
    recent7Days.push({
      date: dayStr,
      dayName: DAY_NAMES[dayDate.getUTCDay()],
      practiced: dateSet.has(dayStr),
      isToday: dayStr === today,
    });
  }

  return {
    currentStreak,
    longestStreak,
    hasPracticedToday,
    streakPreservedYesterday,
    multiplier,
    recent7Days,
  };
}
