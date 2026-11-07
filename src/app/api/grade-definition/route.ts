import { NextResponse, type NextRequest } from "next/server";
import { gradeDefinitionLocal } from "@/core/gradeDefinition";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      targetWord,
      officialDefinition,
      userDefinition,
      partOfSpeech,
      exampleSentence,
    } = body;

    if (!targetWord || !officialDefinition || typeof userDefinition !== "string") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    // If an Anthropic API Key is provided, use Claude for intelligent evaluation
    if (apiKey) {
      try {
        const prompt = `You are a supportive, encouraging English vocabulary teacher grading a learner's explanation of a word.
Word: "${targetWord}"
Part of Speech: "${partOfSpeech || "n/a"}"
Official Dictionary Definition: "${officialDefinition}"
Example Sentence: "${exampleSentence || "n/a"}"

Learner's Explanation: "${userDefinition}"

Evaluate whether the learner correctly understood and conveyed the core meaning of the word in their own words.
Be encouraging and tolerant of minor grammatical mistakes or informal phrasing, as long as the semantic meaning is captured.
Do NOT give full credit if they simply repeated the word itself or gave an irrelevant answer.

Respond ONLY with valid JSON in this exact structure:
{
  "score": <integer from 0 to 100>,
  "passed": <boolean: true if score >= 60, false otherwise>,
  "feedback": "<1-2 sentences of encouraging, actionable teacher feedback>",
  "keyConceptsMatched": ["<concept1>", "<concept2>"],
  "missingConcepts": ["<missing concept if any>"]
}`;

        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 300,
            temperature: 0.2,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const textContent = aiData.content?.[0]?.text;
          if (textContent) {
            // Clean markdown blocks if present
            const cleanJson = textContent.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({
              ...parsed,
              gradedBy: "ai",
            });
          }
        }
      } catch (aiErr) {
        console.warn("Anthropic API grading fallback to local:", aiErr);
      }
    }

    // Local semantic keyword evaluation fallback
    const localResult = gradeDefinitionLocal({
      targetWord,
      officialDefinition,
      userDefinition,
      partOfSpeech,
      exampleSentence,
    });

    return NextResponse.json({
      ...localResult,
      gradedBy: "local",
    });
  } catch (error) {
    console.error("Grade definition error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
