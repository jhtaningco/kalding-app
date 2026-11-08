/**
 * Pure TypeScript daily goal progress calculator.
 * No React, Next.js, or browser dependencies.
 */

import { DAILY } from "./config";

export interface DailyGoalProgress {
  pointsToday: number;
  goalPoints: number;
  pointsRemaining: number;
  percent: number; // 0 to 100
  rawPercent: number; // can exceed 100 if user overachieved
  isGoalMet: boolean;
  cheerMessage: string;
}

export function calculateDailyGoalProgress(
  pointsToday: number,
  customGoalPoints?: number | null,
): DailyGoalProgress {
  const goalPoints = customGoalPoints && customGoalPoints > 0 ? customGoalPoints : DAILY.goalPoints;
  const safePoints = Math.max(0, Math.round(pointsToday));
  const pointsRemaining = Math.max(0, goalPoints - safePoints);

  const rawPercent = Math.round((safePoints / goalPoints) * 100);
  const percent = Math.min(100, rawPercent);
  const isGoalMet = safePoints >= goalPoints;

  let cheerMessage = "";
  if (isGoalMet) {
    if (safePoints >= goalPoints * 2) {
      cheerMessage = "Incredible! You doubled your daily goal today!";
    } else {
      cheerMessage = "Daily goal achieved! Kalding is leaping with joy!";
    }
  } else if (percent >= 75) {
    cheerMessage = `Almost there! Just ${pointsRemaining} points left to finish today's goal.`;
  } else if (percent >= 50) {
    cheerMessage = `Halfway through! Keep up the momentum.`;
  } else if (percent > 0) {
    cheerMessage = `Great start today! ${pointsRemaining} points to go.`;
  } else {
    cheerMessage = `Ready for today's practice? Reach ${goalPoints} points to protect your streak!`;
  }

  return {
    pointsToday: safePoints,
    goalPoints,
    pointsRemaining,
    percent,
    rawPercent,
    isGoalMet,
    cheerMessage,
  };
}
