import { describe, it, expect } from "vitest";
import { gradeDefinitionLocal } from "./gradeDefinition";

describe("gradeDefinitionLocal", () => {
  it("gives high score for accurate definition covering key concepts", () => {
    const res = gradeDefinitionLocal({
      targetWord: "tenacious",
      officialDefinition: "Tending to keep a firm hold of something; clinging or adhering closely; persistent.",
      userDefinition: "Holding firmly onto goals and being persistent without giving up.",
      partOfSpeech: "adjective",
    });

    expect(res.passed).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(60);
    expect(res.keyConceptsMatched.length).toBeGreaterThan(0);
  });

  it("penalizes tautological definitions that just repeat the target word", () => {
    const res = gradeDefinitionLocal({
      targetWord: "resilient",
      officialDefinition: "Able to withstand or recover quickly from difficult conditions.",
      userDefinition: "It means being resilient.",
      partOfSpeech: "adjective",
    });

    expect(res.passed).toBe(false);
    expect(res.score).toBeLessThan(40);
    expect(res.feedback).toContain("without repeating");
  });

  it("rejects overly short inputs", () => {
    const res = gradeDefinitionLocal({
      targetWord: "diligent",
      officialDefinition: "Having or showing care and conscientiousness in one's work.",
      userDefinition: "good",
      partOfSpeech: "adjective",
    });

    expect(res.passed).toBe(false);
    expect(res.score).toBeLessThan(30);
  });
});
