import { describe, expect, it } from "vitest";
import {
  calculateTypingAccuracy,
  evaluateLiveTyping,
  isWordAnswerCorrect,
  normalizeAnswer,
} from "./checkAnswer";

describe("checkAnswer core logic", () => {
  it("normalizes answers by trimming and lowercasing", () => {
    expect(normalizeAnswer("  Resilient  ")).toBe("resilient");
    expect(normalizeAnswer("CAPRICIOUS")).toBe("capricious");
  });

  it("checks exact word matches case-insensitively and ignores surrounding spaces", () => {
    expect(isWordAnswerCorrect("resilient", "resilient")).toBe(true);
    expect(isWordAnswerCorrect("Resilient", "  resilient  ")).toBe(true);
    expect(isWordAnswerCorrect("resilient", "RESILIENT")).toBe(true);
    expect(isWordAnswerCorrect("resilient", "resiliant")).toBe(false);
    expect(isWordAnswerCorrect("resilient", "resil")).toBe(false);
  });

  it("evaluates live typing accurately for correct letters", () => {
    const res = evaluateLiveTyping("goat", "go");
    expect(res.cursorIndex).toBe(2);
    expect(res.isMatchingSoFar).toBe(true);
    expect(res.isExactMatch).toBe(false);
    expect(res.letters).toEqual([
      { char: "g", expectedChar: "g", status: "correct" },
      { char: "o", expectedChar: "o", status: "correct" },
      { char: "a", expectedChar: "a", status: "pending" },
      { char: "t", expectedChar: "t", status: "pending" },
    ]);
  });

  it("flags wrong letters and overflow extra letters", () => {
    const res = evaluateLiveTyping("goat", "goxte");
    expect(res.isMatchingSoFar).toBe(false);
    expect(res.isExactMatch).toBe(false);
    expect(res.letters[2]).toEqual({ char: "x", expectedChar: "a", status: "wrong" });
    expect(res.extraLetters).toEqual(["e"]);
  });

  it("detects exact full match", () => {
    const res = evaluateLiveTyping("goat", "goat");
    expect(res.isMatchingSoFar).toBe(true);
    expect(res.isExactMatch).toBe(true);
    expect(res.letters.every((l) => l.status === "correct")).toBe(true);
  });

  it("calculates typing accuracy percentage correctly", () => {
    expect(calculateTypingAccuracy(10, 0)).toBe(100);
    expect(calculateTypingAccuracy(10, 1)).toBe(90);
    expect(calculateTypingAccuracy(10, 5)).toBe(50);
    expect(calculateTypingAccuracy(5, 10)).toBe(0);
  });
});
