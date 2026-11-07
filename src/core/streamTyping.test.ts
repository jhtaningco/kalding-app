import { describe, it, expect } from "vitest";
import {
  checkStreamWord,
  evaluateStreamSession,
  parseSentenceTokens,
} from "./streamTyping";

describe("streamTyping", () => {
  it("evaluates matching words correctly", () => {
    const res = checkStreamWord("kalding", "kalding");
    expect(res.isCorrect).toBe(true);
    expect(res.errors).toBe(0);
    expect(res.charMatches).toBe(7);
  });

  it("detects errors in misspelled words", () => {
    const res = checkStreamWord("tenacious", "tenatious");
    expect(res.isCorrect).toBe(false);
    expect(res.errors).toBe(1);
  });

  it("evaluates stream session with WPM and points", () => {
    const targets = ["resilient", "diligent", "serendipity"];
    const typeds = ["resilient", "diligent", "serendipity"];
    const res = evaluateStreamSession(targets, typeds, 10000); // 10 seconds

    expect(res.correctWords).toBe(3);
    expect(res.incorrectWords).toBe(0);
    expect(res.accuracy).toBe(100);
    expect(res.netWpm).toBeGreaterThan(0);
    expect(res.pointsEarned).toBeGreaterThan(15);
  });

  it("parses sentence tokens accurately", () => {
    const tokens = parseSentenceTokens("The goat climbed.");
    expect(tokens.length).toBe(5); // "The", " ", "goat", " ", "climbed."
    expect(tokens[0].text).toBe("The");
    expect(tokens[0].isWord).toBe(true);
    expect(tokens[1].text).toBe(" ");
    expect(tokens[1].isWord).toBe(false);
  });
});
