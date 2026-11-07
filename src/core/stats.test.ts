import { describe, it, expect } from "vitest";
import {
  calculateOverallAccuracy,
  formatPracticeDuration,
  identifyWeakestWords,
  generate30DayHeatmap,
} from "./stats";

describe("stats", () => {
  it("calculates overall accuracy accurately", () => {
    const attempts = [
      { accuracy: 100, correct: true },
      { accuracy: 80, correct: true },
      { accuracy: 60, correct: false },
    ];
    expect(calculateOverallAccuracy(attempts)).toBe(80);
  });

  it("handles normalized 0..1 accuracy values", () => {
    const attempts = [
      { accuracy: 1.0, correct: true },
      { accuracy: 0.9, correct: true },
    ];
    expect(calculateOverallAccuracy(attempts)).toBe(95);
  });

  it("formats practice durations cleanly", () => {
    expect(formatPracticeDuration(0)).toBe("0s");
    expect(formatPracticeDuration(45000)).toBe("45s");
    expect(formatPracticeDuration(135000)).toBe("2m 15s");
    expect(formatPracticeDuration(3665000)).toBe("1h 1m");
  });

  it("identifies weakest words with highest mistake rates", () => {
    const attempts = [
      { word_id: "w1", correct: true, accuracy: 100 },
      { word_id: "w1", correct: true, accuracy: 100 },
      { word_id: "w2", correct: false, accuracy: 30 },
      { word_id: "w2", correct: false, accuracy: 40 },
      { word_id: "w3", correct: false, accuracy: 50 },
      { word_id: "w3", correct: true, accuracy: 90 },
    ];

    const weakest = identifyWeakestWords(attempts, 2);
    expect(weakest.length).toBe(2);
    expect(weakest[0].wordId).toBe("w2"); // 100% error rate
    expect(weakest[1].wordId).toBe("w3"); // 50% error rate
  });

  it("generates exactly 30 days for heatmap", () => {
    const heatmap = generate30DayHeatmap(["2026-11-07"], "2026-11-07");
    expect(heatmap.length).toBe(30);
    expect(heatmap[29].isToday).toBe(true);
    expect(heatmap[29].practiced).toBe(true);
    expect(heatmap[0].isToday).toBe(false);
  });
});
