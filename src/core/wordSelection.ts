/**
 * Pure TypeScript engine for smart practice session word selection.
 * Ensures the learner encounters all words in the library rather than
 * always practicing the first 10 rows in database order.
 *
 * Priority order:
 * 1. Unseen words (never practiced)
 * 2. Due words (ready for SRS review)
 * 3. Least seen words (reinforce weaker vocabulary)
 * 4. Shuffled remaining words
 */

export interface WordItem {
  id: string;
  word: string;
  part_of_speech: string;
  definition: string;
  example_sentence?: string | null;
  level?: string | null;
  language?: string | null;
  phonetic?: string | null;
  created_at?: string;
}

export interface UserWordProgress {
  word_id: string;
  times_seen: number;
  next_review_at?: string | null;
}

/**
 * Deterministic pseudo-random number generator for reproducible shuffles.
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Fisher-Yates array shuffle with optional seed.
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  const rand = seed !== undefined ? pseudoRandom(seed) : Math.random;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface SelectPracticeWordsOptions<T extends WordItem = WordItem> {
  words: T[];
  userProgress?: UserWordProgress[];
  count: number;
  now?: Date;
  seed?: number;
}

export function selectPracticeWords<T extends WordItem = WordItem>({
  words,
  userProgress = [],
  count,
  now = new Date(),
  seed,
}: SelectPracticeWordsOptions<T>): T[] {
  if (words.length <= count) {
    return shuffleArray(words, seed);
  }

  const progressMap = new Map<string, UserWordProgress>();
  for (const p of userProgress) {
    progressMap.set(p.word_id, p);
  }

  const unseen: T[] = [];
  const due: T[] = [];
  const reviewing: T[] = [];

  const nowIso = now.toISOString();

  for (const w of words) {
    const p = progressMap.get(w.id);
    if (!p || p.times_seen === 0) {
      unseen.push(w);
    } else if (p.next_review_at && p.next_review_at <= nowIso) {
      due.push(w);
    } else {
      reviewing.push(w);
    }
  }

  // Shuffle pools so choices vary every session
  const shuffledUnseen = shuffleArray(unseen, seed ? seed + 1 : undefined);
  const shuffledDue = shuffleArray(due, seed ? seed + 2 : undefined);
  const shuffledReviewing = shuffleArray(
    reviewing.sort((a, b) => {
      const pA = progressMap.get(a.id)?.times_seen ?? 0;
      const pB = progressMap.get(b.id)?.times_seen ?? 0;
      return pA - pB;
    }),
    seed ? seed + 3 : undefined,
  );

  const selected: T[] = [];

  // 1. Take unseen words (up to 60% of the session to introduce new words steadily)
  const maxUnseen = Math.max(1, Math.floor(count * 0.6));
  for (const w of shuffledUnseen) {
    if (selected.length < maxUnseen) {
      selected.push(w);
    }
  }

  // 2. Add due SRS words
  for (const w of shuffledDue) {
    if (selected.length < count) {
      selected.push(w);
    }
  }

  // 3. Fill remaining slots with remaining unseen or reviewing words
  const remainingPool = [...shuffledUnseen.slice(selected.length), ...shuffledReviewing];
  for (const w of remainingPool) {
    if (selected.length < count && !selected.some((item) => item.id === w.id)) {
      selected.push(w);
    }
  }

  // 4. Fallback if still not enough
  for (const w of words) {
    if (selected.length < count && !selected.some((item) => item.id === w.id)) {
      selected.push(w);
    }
  }

  // Final shuffle of the session order so words don't appear in predictable clusters
  return shuffleArray(selected, seed ? seed + 4 : undefined);
}
