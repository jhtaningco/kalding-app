import { useEffect } from "react";
import { speak } from "@/lib/tts";
import type { Tables } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SpeakerIcon, StarIcon } from "@/components/ui/icons";
import { blankWordInSentence } from "@/core/blankSentence";

export type PracticeMode =
  | "def_to_word"
  | "fill_blank"
  | "dictation"
  | "speed_run"
  | "word_to_def";

export type PromptCardProps = {
  word: Tables<"words">;
  status: "idle" | "correct" | "wrong";
  mode?: PracticeMode;
  revealedLetters?: string;
  pointsEarned?: number;
};

export function PromptCard({
  word,
  status,
  mode = "def_to_word",
  revealedLetters,
  pointsEarned,
}: PromptCardProps) {
  const isAnswered = status !== "idle";
  const tone =
    status === "correct" ? "success" : status === "wrong" ? "danger" : "default";

  // In dictation mode, automatically pronounce the word once on exercise load
  useEffect(() => {
    if (mode === "dictation") {
      const timer = setTimeout(() => {
        speak(word.word);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [mode, word.word]);

  const { blankedSentence } = blankWordInSentence(
    word.example_sentence || "",
    word.word,
  );

  return (
    <Card
      tone={tone}
      className={`flex w-full flex-col gap-4 p-6 text-left transition-all sm:p-8 ${
        status === "correct" ? "animate-pop" : status === "wrong" ? "animate-shake" : ""
      }`}
    >
      {/* Top Badges and Pronounce Button */}
      <div className="border-border/60 flex items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="neutral" className="text-xs">
            {word.part_of_speech}
          </Chip>
          {word.level && (
            <span className="border-border/80 bg-background text-muted rounded-full border px-2.5 py-0.5 text-xs font-extrabold capitalize">
              {word.level}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => speak(word.word)}
          aria-label={`Listen to ${word.word}`}
          title="Pronounce word"
          className="border-border bg-card text-muted hover:bg-border/40 hover:text-foreground focus:ring-focus inline-flex size-9 items-center justify-center rounded-xl border-2 transition-colors focus:ring-2 focus:outline-none"
        >
          <SpeakerIcon size={18} />
        </button>
      </div>

      {/* Mode Specific Main Prompt */}
      {mode === "fill_blank" ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted text-xs font-extrabold tracking-wider uppercase">
            Complete the sentence
          </p>
          <p className="text-foreground text-xl leading-relaxed font-bold sm:text-2xl">
            {blankedSentence}
          </p>
          <p className="text-muted text-xs italic">
            Clue ({word.part_of_speech}): {word.definition}
          </p>
        </div>
      ) : mode === "dictation" ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="text-muted text-xs font-extrabold tracking-wider uppercase">
            Listen & Type the word
          </p>
          <button
            type="button"
            onClick={() => speak(word.word)}
            className="border-primary/60 bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-3 rounded-2xl border-2 px-6 py-3.5 text-lg font-black transition-all hover:scale-105"
          >
            <SpeakerIcon size={28} />
            <span>Click to Listen Again</span>
          </button>
          {isAnswered && (
            <p className="text-muted text-sm font-semibold">{word.definition}</p>
          )}
        </div>
      ) : mode === "word_to_def" ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted text-xs font-extrabold tracking-wider uppercase">
            Explain this word in your own words
          </p>
          <h2 className="text-primary text-3xl font-black sm:text-4xl">
            {word.word}
          </h2>
          <p className="text-muted text-xs font-bold italic">
            Part of speech: {word.part_of_speech}
          </p>
        </div>
      ) : (
        /* Default: def_to_word and speed_run */
        <div className="flex flex-col gap-2">
          <p className="text-muted text-xs font-extrabold tracking-wider uppercase">
            Definition
          </p>
          <p className="text-foreground text-xl leading-relaxed font-bold sm:text-2xl">
            {word.definition}
          </p>
        </div>
      )}

      {/* Hint if active */}
      {revealedLetters && !isAnswered && (
        <div className="border-border/80 bg-background text-muted flex items-center gap-2 rounded-2xl border p-3 text-sm font-bold">
          <span>Hint: Starts with</span>
          <span className="text-foreground font-mono text-base font-extrabold uppercase">
            &ldquo;{revealedLetters}&rdquo;
          </span>
          <span>({word.word.length} letters total)</span>
        </div>
      )}

      {/* Feedback Reveal after Check */}
      {isAnswered && (
        <div className="border-border/60 bg-background/60 flex flex-col gap-3 rounded-2xl border p-4 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-extrabold tracking-wider uppercase">
              Target Word
            </span>
            {pointsEarned !== undefined && pointsEarned > 0 && (
              <span className="text-success-fg flex items-center gap-1 text-xs font-extrabold">
                <StarIcon size={14} /> +{pointsEarned} points
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-black">{word.word}</span>
            <span className="text-muted text-xs italic">({word.part_of_speech})</span>
          </div>

          {word.example_sentence && (
            <p className="text-muted border-border/60 border-t pt-2 text-xs italic">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
