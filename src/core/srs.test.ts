import { describe, it, expect } from "vitest";
import {
  computeSrsUpdate,
  calculateQualityRating,
  getMasteryStage,
  isDueForReview,
  sortWordsForReview,
} from "./srs";
import { SRS } from "./config";

describe("SRS - Spaced Repetition Core", () => {
  const fixedNow = new Date("2026-11-07T12:00:00Z");

  describe("calculateQualityRating", () => {
    it("returns 5 for fast, accurate correct answers with no hints", () => {
      const q = calculateQualityRating({
        correct: true,
        accuracy: 1.0,
        timeMs: 2500,
        usedHint: false,
      });
      expect(q).toBe(5);
    });

    it("returns 3 when hints are used even if correct", () => {
      const q = calculateQualityRating({
        correct: true,
        accuracy: 1.0,
        timeMs: 2000,
        usedHint: true,
      });
      expect(q).toBe(3);
    });

    it("returns 4 for correct answers with slight inaccuracies/backspaces", () => {
      const q = calculateQualityRating({
        correct: true,
        accuracy: 0.85,
        timeMs: 6000,
        usedHint: false,
      });
      expect(q).toBe(4);
    });

    it("returns appropriate grades for wrong answers based on accuracy", () => {
      expect(calculateQualityRating({ correct: false, accuracy: 0.6 })).toBe(2);
      expect(calculateQualityRating({ correct: false, accuracy: 0.3 })).toBe(1);
      expect(calculateQualityRating({ correct: false, accuracy: 0.0 })).toBe(0);
    });
  });

  describe("computeSrsUpdate", () => {
    it("first correct answer sets interval to 1 day and streak to 1", () => {
      const result = computeSrsUpdate(
        null,
        { correct: true, accuracy: 1.0, timeMs: 2000, usedHint: false },
        fixedNow,
      );

      expect(result.streak_correct).toBe(1);
      expect(result.interval_days).toBe(SRS.firstIntervalDays); // 1
      expect(result.times_seen).toBe(1);
      expect(result.times_correct).toBe(1);
      expect(result.last_seen_at).toBe(fixedNow.toISOString());

      // Next review should be 1 day later
      const expectedReview = new Date(fixedNow.getTime() + 1 * 24 * 60 * 60 * 1000);
      expect(result.next_review_at).toBe(expectedReview.toISOString());
      expect(result.stage).toBe("reviewing");
    });

    it("second consecutive correct answer sets interval to 3 days", () => {
      const prev = {
        ease: 2.5,
        interval_days: 1,
        streak_correct: 1,
        times_seen: 1,
        times_correct: 1,
      };

      const result = computeSrsUpdate(
        prev,
        { correct: true, accuracy: 1.0, timeMs: 3000, usedHint: false },
        fixedNow,
      );

      expect(result.streak_correct).toBe(2);
      expect(result.interval_days).toBe(SRS.secondIntervalDays); // 3
      expect(result.times_seen).toBe(2);
      expect(result.times_correct).toBe(2);
    });

    it("third consecutive correct answer multiplies previous interval by ease", () => {
      const prev = {
        ease: 2.5,
        interval_days: 3,
        streak_correct: 2,
        times_seen: 2,
        times_correct: 2,
      };

      const result = computeSrsUpdate(
        prev,
        { correct: true, accuracy: 1.0, timeMs: 3000, usedHint: false },
        fixedNow,
      );

      expect(result.streak_correct).toBe(3);
      // Math.round(3 * 2.5) = 8
      expect(result.interval_days).toBe(8);
      expect(result.stage).toBe("mastered"); // >= 7 days
    });

    it("wrong answer resets streak to 0, applies lapse interval and ease penalty", () => {
      const prev = {
        ease: 2.5,
        interval_days: 8,
        streak_correct: 3,
        times_seen: 3,
        times_correct: 3,
      };

      const result = computeSrsUpdate(
        prev,
        { correct: false, accuracy: 0.4, timeMs: 5000 },
        fixedNow,
      );

      expect(result.streak_correct).toBe(0);
      expect(result.interval_days).toBe(SRS.lapseIntervalDays);
      expect(result.times_seen).toBe(4);
      expect(result.times_correct).toBe(3); // unchanged
      // Ease reduced by 0.2: 2.5 - 0.2 = 2.3
      expect(result.ease).toBe(2.3);
      expect(result.stage).toBe("reviewing");
    });

    it("ease never drops below SRS.minEase", () => {
      const prev = {
        ease: 1.35,
        interval_days: 1,
        streak_correct: 0,
        times_seen: 5,
        times_correct: 1,
      };

      const result = computeSrsUpdate(
        prev,
        { correct: false, accuracy: 0.1 },
        fixedNow,
      );

      expect(result.ease).toBe(SRS.minEase); // 1.3
    });
  });

  describe("getMasteryStage", () => {
    it("returns 'new' for unattempted words", () => {
      expect(getMasteryStage(0, 0)).toBe("new");
      expect(getMasteryStage(null, 0)).toBe("new");
    });

    it("returns 'learning' for words with 0 interval", () => {
      expect(getMasteryStage(0, 2)).toBe("learning");
    });

    it("returns 'reviewing' for intervals between 1 and 6", () => {
      expect(getMasteryStage(1, 1)).toBe("reviewing");
      expect(getMasteryStage(6, 4)).toBe("reviewing");
    });

    it("returns 'mastered' for intervals of 7 or more", () => {
      expect(getMasteryStage(7, 3)).toBe("mastered");
      expect(getMasteryStage(21, 6)).toBe("mastered");
    });
  });

  describe("isDueForReview", () => {
    it("returns true for undefined or null dates", () => {
      expect(isDueForReview(null, fixedNow)).toBe(true);
      expect(isDueForReview(undefined, fixedNow)).toBe(true);
    });

    it("returns true if review date is in the past or now", () => {
      const past = "2026-11-06T12:00:00Z";
      expect(isDueForReview(past, fixedNow)).toBe(true);
      expect(isDueForReview(fixedNow.toISOString(), fixedNow)).toBe(true);
    });

    it("returns false if review date is in the future", () => {
      const future = "2026-11-08T12:00:00Z";
      expect(isDueForReview(future, fixedNow)).toBe(false);
    });
  });

  describe("sortWordsForReview", () => {
    it("sorts due words before future words", () => {
      const words = [
        { id: "future", next_review_at: "2026-11-09T00:00:00Z", interval_days: 3 },
        { id: "due-past", next_review_at: "2026-11-05T00:00:00Z", interval_days: 1 },
        { id: "due-now", next_review_at: "2026-11-07T10:00:00Z", interval_days: 1 },
      ];

      const sorted = sortWordsForReview(words, fixedNow);
      expect(sorted.map((w) => w.id)).toEqual(["due-past", "due-now", "future"]);
    });
  });
});
