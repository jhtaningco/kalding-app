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
    text: "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma, which is living with the results of other people's thinking.\n\nDon't let the noise of others' opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition.",
  },
  {
    id: "pale-blue-dot",
    title: "The Pale Blue Dot",
    source: "Carl Sagan (Cosmos)",
    category: "philosophy",
    text: "Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives.\n\nThe aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager lived there on a mote of dust suspended in a sunbeam.",
  },
  {
    id: "man-in-arena",
    title: "The Man in the Arena",
    source: "Theodore Roosevelt (Sorbonne Speech)",
    category: "speech",
    text: "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better.\n\nThe credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood; who strives valiantly; who errs, who comes short again and again.",
  },
  {
    id: "pride-prejudice",
    title: "Pride and Prejudice",
    source: "Jane Austen",
    category: "literature",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.",
  },
  {
    id: "great-gatsby",
    title: "So We Beat On",
    source: "F. Scott Fitzgerald (The Great Gatsby)",
    category: "literature",
    text: "Gatsby believed in the green light, the orgastic future that year by year recedes before us. It eluded us then, but that's no matter--to-morrow we will run faster, stretch out our arms farther.\n\nSo we beat on, boats against the current, borne back ceaselessly into the past.",
  },
  {
    id: "i-have-a-dream",
    title: "I Have a Dream",
    source: "Martin Luther King Jr. (March on Washington)",
    category: "speech",
    text: "I say to you today, my friends, though we face the difficulties of today and tomorrow, I still have a dream. It is a dream deeply rooted in the American dream.\n\nI have a dream that one day this nation will rise up, live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal.",
  },
  {
    id: "meditations",
    title: "Morning Resolution",
    source: "Marcus Aurelius (Meditations)",
    category: "philosophy",
    text: "When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil.\n\nBut I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own.",
  },
  {
    id: "clean-code",
    title: "The Art of Simplicity",
    source: "Software Engineering Wisdom",
    category: "philosophy",
    text: "Simplicity is prerequisite for reliability. Any fool can write code that a computer can understand; good programmers write code that humans can understand.\n\nPrograms must be written for people to read, and only incidentally for machines to execute. Elegance is not an optional luxury, but a fundamental virtue.",
  },
  {
    id: "kalding-lore",
    title: "The Legend of Kalding",
    source: "Kalding Chronicles",
    category: "lore",
    text: "High up in the foggy mountains of the Cordilleras, there lived a legendary goat named Kalding. Unlike other goats who merely grazed on grass, Kalding possessed an insatiable hunger for English vocabulary and mechanical keyboards.\n\nEvery morning at sunrise, Kalding clattered keys across the cool mountain breeze, transcribing ancient literature while the misty peaks echoed with swift, flawless keystrokes.",
  },
  {
    id: "kalding-keycaps",
    title: "The Mechanical Keycaps",
    source: "Kalding Chronicles",
    category: "lore",
    text: "Kalding tapped the spacebar with one nimble hoof. The crisp, tactile click resonated across the mountain sanctuary like a wooden temple bell.\n\nWith every polished paragraph completed, a golden spark erupted from the keyboard, illuminating new vocabulary words in the starry night sky.",
  },
];

export interface SavedCustomText {
  id: string;
  title: string;
  text: string;
  source?: string;
  category?: "custom" | "literature" | "speech" | "philosophy" | "lore";
  createdAt: number;
  wordCount: number;
}

/**
 * Validates custom text input for minimum words and reasonable title length.
 */
export function validateCustomText(
  title: string,
  text: string,
): { valid: boolean; error?: string } {
  const stats = getCustomTextStats(text);
  if (stats.wordCount < 3) {
    return {
      valid: false,
      error: "Please provide at least 3 words to practice typing.",
    };
  }

  if (title.trim().length > 80) {
    return {
      valid: false,
      error: "Title must be 80 characters or fewer.",
    };
  }

  return { valid: true };
}

/**
 * Creates a normalized SavedCustomText entity for storage.
 */
export function createSavedCustomText(
  title: string,
  text: string,
  options?: { source?: string; category?: SavedCustomText["category"] },
): SavedCustomText {
  const cleanedText = normalizeCustomText(text);
  const stats = getCustomTextStats(cleanedText);

  let cleanTitle = title.trim();
  if (!cleanTitle) {
    // Generate fallback title from first few words
    const firstWords = cleanedText.split(/\s+/).slice(0, 4).join(" ");
    cleanTitle = firstWords ? `Excerpt: ${firstWords}...` : "Saved Excerpt";
  }

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle,
    text: cleanedText,
    source: options?.source?.trim() || "User Saved",
    category: options?.category || "custom",
    createdAt: Date.now(),
    wordCount: stats.wordCount,
  };
}

/**
 * Filters presets by category.
 */
export function filterCustomPresets(
  presets: CustomTextPreset[],
  category: string,
): CustomTextPreset[] {
  if (!category || category === "all") {
    return presets;
  }
  return presets.filter((p) => p.category === category);
}

export interface NormalizationOptions {
  normalizeQuotes?: boolean;
  normalizeDashes?: boolean;
  normalizeWhitespace?: boolean;
  preserveParagraphs?: boolean;
}

/**
 * Normalizes pasted text so it is fluidly typeable on standard QWERTY keyboards:
 * - Replaces typographic curly quotes (“ ” ‘ ’) with standard straight quotes (" ')
 * - Replaces em-dashes and en-dashes (— –) with standard dashes (-- -)
 * - Converts non-breaking spaces (\u00A0) and consecutive whitespace to a single space
 * - When preserveParagraphs is true (default): preserves clean paragraph breaks (\n)
 *   while removing redundant blank lines and soft linebreaks.
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
    preserveParagraphs = true,
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

  // Standardize CRLF and CR to LF
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (preserveParagraphs) {
    const hasDoubleNewlines = /\n\s*\n/.test(text);

    let paragraphs: string[];
    if (hasDoubleNewlines) {
      // Split by double newlines; inside each paragraph, collapse soft linebreaks
      paragraphs = text.split(/\n\s*\n+/).map((p) => {
        let cleanP = p.replace(/\n+/g, " ");
        if (normalizeWhitespace) {
          cleanP = cleanP.replace(/[ \t]+/g, " ");
        }
        return cleanP.trim();
      });
    } else {
      // If only single newlines exist, treat each non-empty line as a paragraph/line
      paragraphs = text.split(/\n+/).map((p) => {
        let cleanP = p;
        if (normalizeWhitespace) {
          cleanP = cleanP.replace(/[ \t]+/g, " ");
        }
        return cleanP.trim();
      });
    }

    return paragraphs.filter(Boolean).join("\n");
  } else {
    // Flatten all newlines into single spaces
    text = text.replace(/[\r\n]+/g, " ");
    if (normalizeWhitespace) {
      text = text.replace(/[ \t]+/g, " ");
    }
    return text.trim();
  }
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
