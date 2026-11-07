export type DictionaryEntry = {
  word: string;
  part_of_speech: string;
  definition: string;
  example_sentence: string;
  level: "beginner" | "intermediate" | "advanced";
  language: "en";
};

/**
 * Fetches definition and example sentence for an English word using the Free Dictionary API.
 * Free, requires no API key.
 */
export async function fetchWordDefinition(
  rawWord: string,
): Promise<DictionaryEntry | null> {
  const word = rawWord.trim().toLowerCase();
  if (!word) return null;

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const firstEntry = data[0];
    const meanings = firstEntry.meanings || [];
    if (meanings.length === 0) return null;

    const firstMeaning = meanings[0];
    const partOfSpeech = firstMeaning.partOfSpeech || "noun";
    const definitions = firstMeaning.definitions || [];
    if (definitions.length === 0) return null;

    const firstDef = definitions[0];
    const definition = firstDef.definition?.trim() || "";

    // Look for an example in any definition of this meaning, or generate one
    let example =
      firstDef.example ||
      definitions.find(
        (d: { example?: string }) =>
          typeof d.example === "string" && d.example.length > 0,
      )?.example;

    if (!example) {
      example = `She learned how to use the word "${word}" in her daily conversation.`;
    }

    return {
      word,
      part_of_speech: partOfSpeech,
      definition,
      example_sentence: example,
      level: "intermediate",
      language: "en",
    };
  } catch (err) {
    console.warn(`[Dictionary API] Failed to fetch definition for "${word}":`, err);
    return null;
  }
}

// CLI usage: tsx scripts/import-word.ts <word>
if (
  process.argv[1] &&
  (process.argv[1].endsWith("import-word.ts") ||
    process.argv[1].endsWith("import-word.js"))
) {
  const query = process.argv[2];
  if (!query) {
    console.log("Usage: npx tsx scripts/import-word.ts <word>");
    process.exit(1);
  }

  fetchWordDefinition(query).then((entry) => {
    if (!entry) {
      console.log(`❌ Could not find a definition for "${query}".`);
      process.exit(1);
    }
    console.log("\n📖 Found definition:");
    console.log(JSON.stringify(entry, null, 2));
  });
}
