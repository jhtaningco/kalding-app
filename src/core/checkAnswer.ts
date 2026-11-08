/**
 * Pure TypeScript answer checking logic.
 * No React or browser imports, so it can be reused in Expo / mobile.
 */

export type LetterStatus = "correct" | "wrong" | "pending";

export type LetterFeedback = {
  char: string;
  expectedChar: string;
  status: LetterStatus;
};

export type LiveTypingEvaluation = {
  /** Target word with each character evaluated */
  letters: LetterFeedback[];
  /** Any extra letters typed beyond the target word length */
  extraLetters: string[];
  /** Index of current cursor position in target */
  cursorIndex: number;
  /** Whether the current typed string perfectly matches the target so far */
  isMatchingSoFar: boolean;
  /** Whether the answer is complete and exactly correct */
  isExactMatch: boolean;
};

/**
 * Normalizes user input: removes leading/trailing spaces and lowercases.
 */
export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Checks whether user typed text matches the target word.
 * Case-insensitive, ignores outer whitespace, requires exact spelling.
 */
export function isWordAnswerCorrect(target: string, typed: string): boolean {
  return normalizeAnswer(target) === normalizeAnswer(typed);
}

/**
 * Evaluates live typing as the user types character by character.
 */
export function evaluateLiveTyping(target: string, typed: string): LiveTypingEvaluation {
  const normTarget = target.trim().toLowerCase();
  // Strip only leading spaces during active typing so cursor position stays natural
  const rawTyped = typed.trimStart().toLowerCase();

  const letters: LetterFeedback[] = [];
  let isMatchingSoFar = true;

  for (let i = 0; i < normTarget.length; i++) {
    const expected = normTarget[i];
    const actual = rawTyped[i];

    if (actual === undefined) {
      letters.push({
        char: expected,
        expectedChar: expected,
        status: "pending",
      });
    } else if (actual === expected) {
      letters.push({
        char: actual,
        expectedChar: expected,
        status: "correct",
      });
    } else {
      isMatchingSoFar = false;
      letters.push({
        char: actual,
        expectedChar: expected,
        status: "wrong",
      });
    }
  }

  const extraLetters =
    rawTyped.length > normTarget.length
      ? rawTyped.slice(normTarget.length).split("")
      : [];

  if (extraLetters.length > 0) {
    isMatchingSoFar = false;
  }

  const isExactMatch =
    rawTyped.length === normTarget.length && isMatchingSoFar && rawTyped === normTarget;

  return {
    letters,
    extraLetters,
    cursorIndex: Math.min(rawTyped.length, normTarget.length),
    isMatchingSoFar,
    isExactMatch,
  };
}

/**
 * Calculates typing accuracy percentage (0 to 100) based on mistake count and target length.
 */
export function calculateTypingAccuracy(
  targetLength: number,
  mistakeCount: number,
): number {
  if (targetLength <= 0) return 100;
  if (mistakeCount <= 0) return 100;
  const accuracy = Math.max(0, (targetLength - mistakeCount) / targetLength) * 100;
  return Math.round(accuracy * 10) / 10;
}
