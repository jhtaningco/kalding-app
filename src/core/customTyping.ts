import { getStreakMultiplier } from "./scoring";

export interface CustomTextPreset {
  id: string;
  title: string;
  source: string;
  category: "literature" | "speech" | "philosophy" | "lore";
  text: string;
}

export const PRESET_CUSTOM_TEXTS: CustomTextPreset[] = [
  {
    id: "stay-hungry",
    title: "Stay Hungry, Stay Foolish",
    source: "Steve Jobs (Stanford Commencement)",
    category: "speech",
    text: "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma, which is living with the results of other people's thinking. Don't let the noise of others' opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition.",
  },
  {
    id: "pale-blue-dot",
    title: "The Pale Blue Dot",
    source: "Carl Sagan (Cosmos)",
    category: "philosophy",
    text: "Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines.",
  },
  {
    id: "pride-prejudice",
    title: "Pride and Prejudice",
    source: "Jane Austen",
    category: "literature",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.",
  },
  {
    id: "kalding-lore",
    title: "The Legend of Kalding",
    source: "Kalding Chronicles",
    category: "lore",
    text: "High up in the foggy mountains of the Cordilleras, there lived a legendary goat named Kalding. Unlike other goats who merely grazed on grass, Kalding possessed an insatiable hunger for English vocabulary and mechanical keyboards. Every morning at sunrise, Kalding clattered keys across the cool mountain breeze.",
  },
];

export interface NormalizationOptions {
  normalizeQuotes?: boolean;
  normalizeDashes?: boolean;
  normalizeWhitespace?: boolean;
  normalizeNewlines?: boolean;
}

/**
 * Normalizes pasted text so it is fluidly typeable on standard QWERTY keyboards:
 * - Replaces typographic curly quotes (“ ” ‘ ’) with standard straight quotes (" ')
 * - Replaces em-dashes and en-dashes (— –) with standard dashes (-- -)
 * - Converts non-breaking spaces (\u00A0) and consecutive whitespace to a single space
 * - Trims leading and trailing spaces
 */
export function normalizeCustomText(
  rawText: string,
  options: NormalizationOptions = {},
): string {
  const {
    normalizeQuotes = true,
    normalizeDashes = true,
    normalizeWhitespace = true,
    normalizeNewlines = true,
  } = options;

  let text = rawText || "";

  // Replace non-breaking spaces
  text = text.replace(/\u00A0/g, " ");

  if (normalizeQuotes) {
    text = text
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  }

  if (normalizeDashes) {
    text = text.replace(/\u2014/g, "--").replace(/\u2013/g, "-");
  }

  // Ellipsis
  text = text.replace(/\u2026/g, "...");

  if (normalizeNewlines) {
    text = text.replace(/[\r\n]+/g, " ");
  }

  if (normalizeWhitespace) {
    text = text.replace(/[ \t]+/g, " ");
  }

  return text.trim();
}

export interface CustomTextStats {
  charCount: number;
  wordCount: number;
  estimatedSeconds: number;
}

/**
 * Calculates character count, word count, and estimated typing time (~40 WPM).
 */
export function getCustomTextStats(text: string): CustomTextStats {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  if (charCount === 0) {
    return { charCount: 0, wordCount: 0, estimatedSeconds: 0 };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Estimated seconds assuming ~40 words per minute
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 40) * 60));

  return { charCount, wordCount, estimatedSeconds };
}

export interface CustomTextScoreParams {
  wordCount: number;
  accuracy: number;
  netWpm: number;
  streakDays?: number;
}

export interface CustomTextScoreResult {
  basePoints: number;
  accuracyBonus: number;
  speedBonus: number;
  streakMultiplier: number;
  subtotal: number;
  totalPoints: number;
}

/**
 * Calculates XP score for custom text transcription based on word count,
 * accuracy percentage, typing speed (WPM), and streak multiplier.
 */
export function calculateCustomTextScore({
  wordCount,
  accuracy,
  netWpm,
  streakDays = 0,
}: CustomTextScoreParams): CustomTextScoreResult {
  // Minimum 10 points base, scales with paragraph length (capped at 250)
  const basePoints = Math.max(10, Math.min(250, Math.round(wordCount * 1.5)));

  let accuracyBonus = 0;
  if (accuracy >= 98) {
    accuracyBonus = 25;
  } else if (accuracy >= 95) {
    accuracyBonus = 15;
  } else if (accuracy >= 90) {
    accuracyBonus = 10;
  } else if (accuracy >= 80) {
    accuracyBonus = 5;
  }

  let speedBonus = 0;
  if (netWpm >= 70) {
    speedBonus = 25;
  } else if (netWpm >= 50) {
    speedBonus = 15;
  } else if (netWpm >= 35) {
    speedBonus = 10;
  } else if (netWpm >= 20) {
    speedBonus = 5;
  }

  const streakMultiplier = getStreakMultiplier(streakDays);
  const subtotal = basePoints + accuracyBonus + speedBonus;
  const totalPoints = Math.round(subtotal * streakMultiplier);

  return {
    basePoints,
    accuracyBonus,
    speedBonus,
    streakMultiplier,
    subtotal,
    totalPoints,
  };
}
