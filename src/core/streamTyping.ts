/**
 * Pure TypeScript stream typing and sentence transcription evaluation engine.
 * No React, Next.js, or browser dependencies.
 */

import { calculateWpm, type WpmResult } from "./wpm";

export interface StreamWordResult {
  targetWord: string;
  typedWord: string;
  isCorrect: boolean;
  charMatches: number;
  errors: number;
}

export interface StreamSessionResult extends WpmResult {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  wordResults: StreamWordResult[];
  pointsEarned: number;
}

/**
 * Compares an individual typed word against target word in stream typing.
 */
export function checkStreamWord(
  targetWord: string,
  typedWord: string,
): StreamWordResult {
  const cleanTarget = targetWord.trim();
  const cleanTyped = typedWord.trim();

  const isCorrect = cleanTarget.toLowerCase() === cleanTyped.toLowerCase();

  let charMatches = 0;
  let errors = 0;

  const maxLen = Math.max(cleanTarget.length, cleanTyped.length);
  for (let i = 0; i < maxLen; i++) {
    const tChar = cleanTarget[i];
    const uChar = cleanTyped[i];

    if (tChar && uChar && tChar.toLowerCase() === uChar.toLowerCase()) {
      charMatches += 1;
    } else {
      errors += 1;
    }
  }

  return {
    targetWord: cleanTarget,
    typedWord: cleanTyped,
    isCorrect,
    charMatches,
    errors,
  };
}

/**
 * Computes overall stream session metrics (WPM, accuracy, score) from a list of words.
 */
export function evaluateStreamSession(
  targetWords: string[],
  typedWords: string[],
  elapsedMs: number,
): StreamSessionResult {
  const wordResults: StreamWordResult[] = [];
  let totalCharsTyped = 0;
  let totalErrors = 0;
  let correctWordsCount = 0;

  const count = Math.min(targetWords.length, typedWords.length);
  for (let i = 0; i < count; i++) {
    const res = checkStreamWord(targetWords[i], typedWords[i]);
    wordResults.push(res);

    totalCharsTyped += typedWords[i].length + 1; // +1 for the spacebar
    totalErrors += res.errors;

    if (res.isCorrect) {
      correctWordsCount += 1;
    }
  }

  const wpmMetrics = calculateWpm({
    charactersTyped: totalCharsTyped,
    errors: totalErrors,
    timeMs: elapsedMs,
  });

  // Points formula: 5 base points per correct word + bonus for high accuracy & WPM
  const basePoints = correctWordsCount * 5;
  const speedBonus = Math.round(wpmMetrics.netWpm * 0.5);
  const accuracyBonus = Math.round((wpmMetrics.accuracy / 100) * (correctWordsCount * 3));
  const pointsEarned = Math.max(10, basePoints + speedBonus + accuracyBonus);

  return {
    ...wpmMetrics,
    totalWords: count,
    correctWords: correctWordsCount,
    incorrectWords: count - correctWordsCount,
    wordResults,
    pointsEarned,
  };
}

export interface SentenceToken {
  text: string;
  isWord: boolean;
  charStart: number;
  charEnd: number;
}

/**
 * Breaks a sentence or definition into tokens for letter-by-letter multi-word typing.
 */
export function parseSentenceTokens(text: string): SentenceToken[] {
  const tokens: SentenceToken[] = [];
  const wordsWithSpaces = text.split(/(\s+)/);

  let cursor = 0;
  for (const part of wordsWithSpaces) {
    if (!part) continue;
    const isWord = !/^\s+$/.test(part);
    tokens.push({
      text: part,
      isWord,
      charStart: cursor,
      charEnd: cursor + part.length,
    });
    cursor += part.length;
  }

  return tokens;
}
