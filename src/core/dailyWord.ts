/**
 * Pure TypeScript engine for the "Vocabulary of the Day" challenge.
 * Provides deterministic daily word selection, multi-part drill tracking,
 * and user sentence validation.
 */

import type { WordItem } from "./wordSelection";

export const DAILY_WORD_BONUS_XP = 50;

/**
 * Returns formatted YYYY-MM-DD string for a given date.
 */
export function getDailyWordDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically computes the Word of the Day index based on the date string (YYYY-MM-DD).
 * Same date produces the identical word for all learners.
 * Consecutive days advance through the word library smoothly.
 */
export function getDailyWordIndex(dateKey: string, wordCount: number): number {
  if (wordCount <= 0) return 0;

  const parts = dateKey.split("-").map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 1;
  const day = parts[2] || 1;

  // Simple, collision-free linear hash for daily rotation:
  // Days elapsed since epoch-like baseline:
  const dayIndex = Math.floor(
    (Date.UTC(year, month - 1, day) - Date.UTC(2026, 0, 1)) / (1000 * 60 * 60 * 24),
  );

  return Math.abs(dayIndex) % wordCount;
}

/**
 * Selects today's Word of the Day from the available words.
 */
export function getWordOfTheDay<T extends WordItem>(words: T[], dateKey?: string): T | null {
  if (!words || words.length === 0) return null;
  const key = dateKey || getDailyWordDateKey();
  const index = getDailyWordIndex(key, words.length);
  return words[index] || words[0];
}

export interface SentenceValidationResult {
  isValid: boolean;
  message: string;
  hasTargetWord: boolean;
  hasPunctuation: boolean;
  wordCount: number;
}

/**
 * Validates that the learner's own custom sentence correctly incorporates the target word.
 */
export function validateUserSentence(
  sentence: string,
  targetWord: string,
): SentenceValidationResult {
  const trimmed = sentence.trim();

  if (!trimmed) {
    return {
      isValid: false,
      message: "Please write a sentence using the target word.",
      hasTargetWord: false,
      hasPunctuation: false,
      wordCount: 0,
    };
  }

  const words = trimmed.split(/\s+/);
  const wordCount = words.length;

  if (wordCount < 4) {
    return {
      isValid: false,
      message: "Your sentence is too short. Try writing at least 4 words.",
      hasTargetWord: false,
      hasPunctuation: false,
      wordCount,
    };
  }

  // Check if target word (or its root stem) appears in the sentence
  const targetLower = targetWord.toLowerCase().replace(/[^a-z]/g, "");
  // Stemming fallback: root of at least 4 letters
  const stem = targetLower.length > 5 ? targetLower.slice(0, targetLower.length - 2) : targetLower;

  const lowerSentence = trimmed.toLowerCase();
  const regex = new RegExp(`\\b${targetLower}\\b`, "i");
  const stemRegex = new RegExp(`\\b${stem}[a-z]*\\b`, "i");

  const hasTargetWord = regex.test(lowerSentence) || stemRegex.test(lowerSentence);

  if (!hasTargetWord) {
    return {
      isValid: false,
      message: `Your sentence must include the word "${targetWord}".`,
      hasTargetWord: false,
      hasPunctuation: false,
      wordCount,
    };
  }

  const hasPunctuation = /[.!?]$/.test(trimmed);
  if (!hasPunctuation) {
    return {
      isValid: false,
      message: "End your sentence with punctuation (period, exclamation point, or question mark).",
      hasTargetWord: true,
      hasPunctuation: false,
      wordCount,
    };
  }

  return {
    isValid: true,
    message: `Excellent sentence! You used "${targetWord}" in context.`,
    hasTargetWord: true,
    hasPunctuation: true,
    wordCount,
  };
}
