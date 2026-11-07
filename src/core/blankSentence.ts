/**
 * Pure TypeScript helper to blank out a target word inside an example sentence.
 * No React, Next.js, or browser dependencies.
 */

export interface BlankSentenceResult {
  blankedSentence: string;
  matched: boolean;
  targetWord: string;
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Blanks out the target word (or its common inflections) in an example sentence.
 * Replaces the word with a blank placeholder like `________`.
 */
export function blankWordInSentence(
  sentence: string,
  targetWord: string,
  placeholder: string = "________",
): BlankSentenceResult {
  const cleanWord = targetWord.trim();
  const cleanSentence = sentence.trim();

  if (!cleanWord || !cleanSentence) {
    return {
      blankedSentence: cleanSentence,
      matched: false,
      targetWord: cleanWord,
    };
  }

  // 1. Try exact word boundary match (case-insensitive)
  const exactRegex = new RegExp(`\\b${escapeRegex(cleanWord)}\\b`, "i");
  if (exactRegex.test(cleanSentence)) {
    return {
      blankedSentence: cleanSentence.replace(exactRegex, placeholder),
      matched: true,
      targetWord: cleanWord,
    };
  }

  // 2. Try common English inflection suffixes: s, es, ed, d, ing, ly, er, est
  const inflections = ["s", "es", "ed", "d", "ing", "ly", "er", "est"];
  for (const suffix of inflections) {
    const inflectedRegex = new RegExp(
      `\\b${escapeRegex(cleanWord)}${suffix}\\b`,
      "i",
    );
    if (inflectedRegex.test(cleanSentence)) {
      return {
        blankedSentence: cleanSentence.replace(inflectedRegex, placeholder),
        matched: true,
        targetWord: cleanWord,
      };
    }
  }

  // 3. Try dropping a trailing 'e' before adding 'ing' or 'ed' (e.g. drive -> driving)
  if (cleanWord.endsWith("e")) {
    const stem = cleanWord.slice(0, -1);
    const dropERegex = new RegExp(`\\b${escapeRegex(stem)}(ing|ed)\\b`, "i");
    if (dropERegex.test(cleanSentence)) {
      return {
        blankedSentence: cleanSentence.replace(dropERegex, placeholder),
        matched: true,
        targetWord: cleanWord,
      };
    }
  }

  // 4. Fallback: if no match found, append the blank prompt at the end
  return {
    blankedSentence: `${cleanSentence} [${placeholder}]`,
    matched: false,
    targetWord: cleanWord,
  };
}
