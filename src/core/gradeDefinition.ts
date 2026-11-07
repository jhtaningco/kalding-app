/**
 * Local semantic keyword definition grader fallback.
 * Pure TypeScript: no React, Next.js, or browser dependencies.
 * Used when offline or when ANTHROPIC_API_KEY is not configured.
 */

const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "means",
  "meaning",
  "something",
  "someone",
  "state",
  "quality",
  "act",
  "having",
  "like",
  "able",
]);

export interface GradeDefinitionInput {
  targetWord: string;
  officialDefinition: string;
  userDefinition: string;
  partOfSpeech?: string;
  exampleSentence?: string;
}

export interface DefinitionGradeResult {
  score: number; // 0 to 100
  passed: boolean;
  feedback: string;
  keyConceptsMatched: string[];
  missingConcepts: string[];
}

/**
 * Tokenizes text into lowercase clean words without punctuation.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * Extracts key semantic terms excluding stop words.
 */
function extractKeywords(text: string): string[] {
  const tokens = tokenize(text);
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const token of tokens) {
    if (!STOP_WORDS.has(token) && !seen.has(token)) {
      seen.add(token);
      keywords.push(token);
    }
  }

  return keywords;
}

/**
 * Checks whether user word stems or resembles key target word.
 */
function wordMatches(userToken: string, targetToken: string): boolean {
  if (userToken === targetToken) return true;
  // Substring match for basic stems (e.g. persist / persistent, firm / firmly, hold / holding)
  if (userToken.length >= 4 && targetToken.length >= 4) {
    if (userToken.startsWith(targetToken) || targetToken.startsWith(userToken)) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluates learner definition against reference definition using keyword/stem overlap.
 */
export function gradeDefinitionLocal({
  targetWord,
  officialDefinition,
  userDefinition,
}: GradeDefinitionInput): DefinitionGradeResult {
  const cleanUser = userDefinition.trim();
  const cleanTarget = targetWord.trim().toLowerCase();

  // 1. Minimum length validation
  const userTokens = tokenize(cleanUser);
  if (userTokens.length < 2) {
    return {
      score: 10,
      passed: false,
      feedback: "Please provide a more complete explanation in your own words.",
      keyConceptsMatched: [],
      missingConcepts: [],
    };
  }

  // 2. Meaningful tokens excluding stop words
  const meaningfulUserTokens = userTokens.filter((t) => !STOP_WORDS.has(t));

  // Tautology check: user just typed the word itself or only stop words + target word
  const nonTargetMeaningfulTokens = meaningfulUserTokens.filter(
    (t) => !wordMatches(t, cleanTarget),
  );

  if (nonTargetMeaningfulTokens.length === 0) {
    return {
      score: 15,
      passed: false,
      feedback: `Try explaining what "${targetWord}" means without repeating the word itself!`,
      keyConceptsMatched: [],
      missingConcepts: [],
    };
  }

  // 3. Extract keywords from official definition
  const targetKeywords = extractKeywords(officialDefinition);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const targetKey of targetKeywords) {
    const isMatched = meaningfulUserTokens.some((uToken) =>
      wordMatches(uToken, targetKey),
    );
    if (isMatched) {
      matchedKeywords.push(targetKey);
    } else {
      missingKeywords.push(targetKey);
    }
  }

  // Score calculation:
  // Each matched key concept awards substantial credit (typically 2-3 matched concepts represent a full definition)
  const matchCount = matchedKeywords.length;
  let score = 0;

  if (matchCount >= 3) {
    score = 85;
  } else if (matchCount === 2) {
    score = 70;
  } else if (matchCount === 1) {
    score = 50;
  } else {
    score = 25;
  }

  // Bonus for clear, detailed sentence structure (> 4 non-stop words)
  if (nonTargetMeaningfulTokens.length >= 4) {
    score += 15;
  } else if (nonTargetMeaningfulTokens.length >= 2) {
    score += 8;
  }

  score = Math.min(100, Math.max(10, score));
  const passed = score >= 55;

  let feedback = "";
  if (score >= 80) {
    feedback = `Outstanding definition! You captured the core meaning of "${targetWord}".`;
  } else if (score >= 55) {
    feedback = `Good job! Your explanation is accurate. Official definition: "${officialDefinition}".`;
  } else {
    feedback = `Close attempt! Notice the key concepts: ${
      missingKeywords.slice(0, 3).join(", ") || officialDefinition
    }.`;
  }

  return {
    score,
    passed,
    feedback,
    keyConceptsMatched: matchedKeywords,
    missingConcepts: missingKeywords.slice(0, 4),
  };
}
