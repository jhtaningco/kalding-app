import { speak } from "@/lib/tts";
import type { Tables } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SpeakerIcon, StarIcon } from "@/components/ui/icons";

export type PromptCardProps = {
  word: Tables<"words">;
  status: "idle" | "correct" | "wrong";
  revealedLetters?: string;
  pointsEarned?: number;
};

export function PromptCard({
  word,
  status,
  revealedLetters,
  pointsEarned,
}: PromptCardProps) {
  const isAnswered = status !== "idle";
  const tone =
    status === "correct" ? "success" : status === "wrong" ? "danger" : "default";

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

      {/* Main Definition Prompt */}
      <div className="flex flex-col gap-2">
        <p className="text-muted text-xs font-extrabold tracking-wider uppercase">
          Definition
        </p>
        <p className="text-foreground text-xl leading-relaxed font-bold sm:text-2xl">
          {word.definition}
        </p>
      </div>

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
              {status === "correct" ? "Correct Word" : "The word was"}
            </span>
            {status === "correct" && pointsEarned !== undefined && (
              <span className="border-points-fg/40 bg-points-bg text-points-fg inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-extrabold">
                <StarIcon size={14} /> +{pointsEarned} pts
              </span>
            )}
          </div>

          <p className="text-foreground font-mono text-2xl font-extrabold tracking-wider">
            {word.word}
          </p>

          <p className="text-muted text-xs italic">
            &ldquo;{word.example_sentence}&rdquo;
          </p>
        </div>
      )}
    </Card>
  );
}
