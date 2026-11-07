/**
 * Words Per Minute (WPM) and typing metrics calculator.
 * Pure TypeScript: no React, Next.js, or browser dependencies.
 */

export interface WpmInput {
  charactersTyped: number;
  errors: number;
  timeMs: number;
}

export interface WpmResult {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  elapsedSeconds: number;
}

/**
 * Standard typing industry formula:
 * 1 standard word = 5 characters (including spaces/punctuation).
 */
export function calculateWpm({
  charactersTyped,
  errors,
  timeMs,
}: WpmInput): WpmResult {
  const safeTimeMs = Math.max(500, timeMs);
  const minutes = safeTimeMs / (1000 * 60);
  const elapsedSeconds = Math.round(safeTimeMs / 1000);

  // Standard word count
  const standardWords = Math.max(0, charactersTyped) / 5;

  const grossWpm = Math.round(standardWords / minutes);
  const errorRatePerMinute = Math.max(0, errors) / minutes;
  const netWpm = Math.max(0, Math.round(grossWpm - errorRatePerMinute));

  const totalChars = Math.max(0, charactersTyped);
  const safeErrors = Math.max(0, errors);
  const accuracy =
    totalChars === 0
      ? 100
      : Math.max(
          0,
          Math.min(100, Math.round(((totalChars - safeErrors) / totalChars) * 100)),
        );

  return {
    grossWpm,
    netWpm,
    accuracy,
    elapsedSeconds,
  };
}
