import { describe, it, expect } from "vitest";
import { calculateWpm } from "./wpm";

describe("wpm", () => {
  it("calculates accurate WPM for typical typing speed", () => {
    // 250 chars in 60,000 ms (1 minute) = 50 words / min
    const res = calculateWpm({
      charactersTyped: 250,
      errors: 0,
      timeMs: 60000,
    });

    expect(res.grossWpm).toBe(50);
    expect(res.netWpm).toBe(50);
    expect(res.accuracy).toBe(100);
    expect(res.elapsedSeconds).toBe(60);
  });

  it("deducts uncorrected errors from net WPM", () => {
    // 300 chars (60 gross words) in 1 min with 5 errors -> 55 net WPM
    const res = calculateWpm({
      charactersTyped: 300,
      errors: 5,
      timeMs: 60000,
    });

    expect(res.grossWpm).toBe(60);
    expect(res.netWpm).toBe(55);
    expect(res.accuracy).toBe(98);
  });

  it("handles fast short intervals without division by zero", () => {
    const res = calculateWpm({
      charactersTyped: 10,
      errors: 0,
      timeMs: 200,
    });

    expect(res.grossWpm).toBeGreaterThan(0);
    expect(res.accuracy).toBe(100);
  });

  it("floors net WPM at zero when errors exceed speed", () => {
    const res = calculateWpm({
      charactersTyped: 10,
      errors: 20,
      timeMs: 10000,
    });

    expect(res.netWpm).toBe(0);
  });
});
