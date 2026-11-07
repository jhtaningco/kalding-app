"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { speak } from "@/lib/tts";
import type { Tables } from "@/types/database";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { LightbulbIcon, SpeakerIcon } from "@/components/ui/icons";

const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "phrase",
];

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export function WordsManager({ initialWords }: { initialWords: Tables<"words">[] }) {
  const [words, setWords] = useState<Tables<"words">[]>(initialWords);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  // Form state
  const [word, setWord] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("adjective");
  const [definition, setDefinition] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate",
  );

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // Kalding mood based on state
  let mood: KaldingMood = "neutral";
  let bubbleText = "Here are the words in your learning bank. Add your own anytime!";

  if (isSaving || isLookingUp) {
    mood = "thinking";
    bubbleText = isLookingUp
      ? "Consulting the dictionary..."
      : "Saving your word to the database...";
  } else if (feedback?.type === "success") {
    mood = "celebrate";
    bubbleText = feedback.text;
  } else if (feedback?.type === "error") {
    mood = "oops";
    bubbleText = feedback.text;
  }

  // Handle dictionary auto-fill
  const handleDictionaryLookup = async () => {
    const q = word.trim();
    if (!q) {
      setFeedback({ type: "error", text: "Type a word first before looking it up!" });
      return;
    }

    setIsLookingUp(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setFeedback({
          type: "info",
          text: `No automated definition found for "${q}". You can enter one manually!`,
        });
        setIsLookingUp(false);
        return;
      }

      const data = await res.json();
      if (data.definition) {
        setDefinition(data.definition);
        if (data.part_of_speech) setPartOfSpeech(data.part_of_speech);
        if (data.example_sentence) setExampleSentence(data.example_sentence);
        setFeedback({
          type: "success",
          text: `Found definition for "${q}"! Adjust anything you like, then click Add Word.`,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Could not reach the dictionary service right now. Please type the definition manually.",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Handle adding new word
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = word.trim().toLowerCase();
    const cleanDef = definition.trim();
    const cleanEx = exampleSentence.trim();

    if (!cleanWord || !cleanDef || !cleanEx) {
      setFeedback({ type: "error", text: "Please fill in all word fields." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const newEntry = {
        word: cleanWord,
        part_of_speech: partOfSpeech,
        definition: cleanDef,
        example_sentence: cleanEx,
        level,
        language: "en",
      };

      const { data, error } = await supabase
        .from("words")
        .insert(newEntry)
        .select()
        .single();

      if (error) {
        if (error.code === "23505" || error.message.includes("unique")) {
          setFeedback({
            type: "error",
            text: `The word "${cleanWord}" is already in the database!`,
          });
        } else {
          setFeedback({ type: "error", text: error.message });
        }
        setIsSaving(false);
        return;
      }

      if (data) {
        setWords((prev) => [data, ...prev]);
        setWord("");
        setDefinition("");
        setExampleSentence("");
        setFeedback({
          type: "success",
          text: `"${cleanWord}" was saved to your vocabulary!`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save word.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered words
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesSearch =
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.definition.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = selectedLevel === "all" || w.level === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [words, search, selectedLevel]);

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Header with Mascot */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <Kalding mood={mood} size={110} title={`Kalding is ${mood}`} />
        <SpeechBubble className="flex-1 text-base">{bubbleText}</SpeechBubble>
      </div>

      {/* Add Custom Word Section */}
      <Card className="border-primary/40 bg-card flex flex-col gap-5 border-2 p-6">
        <div className="border-border flex items-center justify-between border-b-2 pb-3">
          <div>
            <h2 className="text-foreground text-xl font-extrabold">Add a Word</h2>
            <p className="text-muted text-xs">
              Expand your vocabulary by adding custom words to your practice rotation.
            </p>
          </div>
          <Chip variant="mode">English (en)</Chip>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`rounded-2xl border-2 p-3.5 text-xs font-bold ${
              feedback.type === "success"
                ? "border-success-border bg-success-bg text-success-fg"
                : feedback.type === "error"
                  ? "border-danger-border bg-danger-bg text-danger-fg"
                  : "border-border bg-background text-foreground"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleAddWord} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Word Input */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="new-word"
                className="text-muted text-xs font-extrabold tracking-wider uppercase"
              >
                Word
              </label>
              <div className="flex gap-2">
                <input
                  id="new-word"
                  type="text"
                  required
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="e.g. resilient"
                  className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 flex-1 rounded-2xl border-2 px-4 font-mono font-bold placeholder:font-sans focus:ring-4 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleDictionaryLookup}
                  disabled={isLookingUp || !word.trim()}
                  title="Auto-fill definition and example from Free Dictionary"
                >
                  <LightbulbIcon size={18} />
                  <span className="hidden sm:inline">
                    {isLookingUp ? "Looking up..." : "Lookup"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Part of Speech */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="part-of-speech"
                className="text-muted text-xs font-extrabold tracking-wider uppercase"
              >
                Part of Speech
              </label>
              <select
                id="part-of-speech"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="border-border bg-background text-foreground focus:border-primary focus:ring-focus h-12 rounded-2xl border-2 px-3 font-bold capitalize focus:ring-4 focus:outline-none"
              >
                {PARTS_OF_SPEECH.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Definition */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="definition"
              className="text-muted text-xs font-extrabold tracking-wider uppercase"
            >
              Definition
            </label>
            <input
              id="definition"
              type="text"
              required
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="e.g. able to recover quickly from difficult conditions"
              className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 w-full rounded-2xl border-2 px-4 font-bold focus:ring-4 focus:outline-none"
            />
          </div>

          {/* Example Sentence & Level */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                htmlFor="example"
                className="text-muted text-xs font-extrabold tracking-wider uppercase"
              >
                Example Sentence
              </label>
              <input
                id="example"
                type="text"
                required
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                placeholder="e.g. Children are often remarkably resilient in times of adversity."
                className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 w-full rounded-2xl border-2 px-4 font-bold focus:ring-4 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="level"
                className="text-muted text-xs font-extrabold tracking-wider uppercase"
              >
                Difficulty Level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) =>
                  setLevel(e.target.value as "beginner" | "intermediate" | "advanced")
                }
                className="border-border bg-background text-foreground focus:border-primary focus:ring-focus h-12 rounded-2xl border-2 px-3 font-bold capitalize focus:ring-4 focus:outline-none"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="md" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Word to Bank"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Word Bank Explorer */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-extrabold">
              Word Bank ({filteredWords.length})
            </h2>
            <p className="text-muted text-xs">
              All words available for your typing exercises.
            </p>
          </div>

          {/* Level Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {["all", ...LEVELS].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold capitalize transition-all ${
                  selectedLevel === lvl
                    ? "border-primary bg-primary text-on-primary shadow-[0_2px_0_var(--primary-shadow)]"
                    : "border-border bg-card text-muted hover:text-foreground"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words or definitions..."
          className="border-border bg-card text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-focus h-12 w-full rounded-2xl border-2 px-4 font-bold focus:ring-4 focus:outline-none"
        />

        {/* Words Grid */}
        {filteredWords.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Kalding mood="thinking" size={90} />
            <p className="text-foreground mt-4 text-base font-bold">No words found</p>
            <p className="text-muted text-xs">
              {words.length === 0
                ? "Your database is empty. Run `npm run seed` to load 150 starter words!"
                : "Try adjusting your search query or level filter."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWords.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col justify-between gap-3 p-5 transition-shadow hover:shadow-[0_6px_0_var(--secondary-shadow)]"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-foreground font-mono text-xl font-extrabold">
                      {item.word}
                    </span>
                    <button
                      type="button"
                      onClick={() => speak(item.word)}
                      aria-label={`Pronounce ${item.word}`}
                      title="Listen pronunciation"
                      className="border-border bg-background text-muted hover:bg-border/60 hover:text-foreground focus:ring-focus inline-flex size-8 items-center justify-center rounded-xl border transition-colors focus:ring-2 focus:outline-none"
                    >
                      <SpeakerIcon size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="border-border/80 bg-background text-muted rounded-lg border px-2 py-0.5 text-[11px] font-extrabold uppercase">
                      {item.part_of_speech}
                    </span>
                    {item.level && (
                      <span className="border-success-border/60 bg-success-bg/60 text-success-fg rounded-lg border px-2 py-0.5 text-[11px] font-extrabold capitalize">
                        {item.level}
                      </span>
                    )}
                  </div>

                  <p className="text-foreground/90 text-sm font-semibold">
                    {item.definition}
                  </p>
                </div>

                <div className="border-border/60 bg-background/50 text-muted rounded-xl border p-2.5 text-xs italic">
                  &ldquo;{item.example_sentence}&rdquo;
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
