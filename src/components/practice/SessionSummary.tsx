import type { Tables } from "@/types/database";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, StarIcon, XIcon } from "@/components/ui/icons";

export type SessionResult = {
  word: Tables<"words">;
  correct: boolean;
  pointsEarned: number;
  timeMs: number;
  accuracy: number;
};

export type SessionSummaryProps = {
  results: SessionResult[];
  totalPoints: number;
  onRestart: () => void;
};

export function SessionSummary({ results, totalPoints, onRestart }: SessionSummaryProps) {
  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;
  const avgAccuracy = Math.round(
    results.reduce((acc, r) => acc + r.accuracy, 0) / (totalCount || 1),
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-4 text-center sm:p-6">
      {/* Header and Mascot */}
      <div className="flex flex-col items-center gap-3">
        <Kalding mood="celebrate" size={150} title="Kalding celebrating your practice" />
        <SpeechBubble className="text-base sm:text-lg">
          Mabuhay! You completed your 10-word practice session!
        </SpeechBubble>
      </div>

      {/* Summary Score Cards */}
      <div className="grid w-full grid-cols-3 gap-3">
        <Card className="flex flex-col items-center justify-center p-4">
          <span className="bg-points-bg text-points-fg inline-flex size-8 items-center justify-center rounded-full">
            <StarIcon size={18} />
          </span>
          <span className="text-foreground mt-1 font-mono text-2xl font-extrabold">
            +{totalPoints}
          </span>
          <span className="text-muted text-[11px] font-extrabold tracking-wider uppercase">
            Points
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4">
          <span className="bg-success-bg text-success-fg inline-flex size-8 items-center justify-center rounded-full">
            <CheckIcon size={18} />
          </span>
          <span className="text-foreground mt-1 font-mono text-2xl font-extrabold">
            {correctCount}/{totalCount}
          </span>
          <span className="text-muted text-[11px] font-extrabold tracking-wider uppercase">
            Correct
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4">
          <span className="bg-border text-foreground inline-flex size-8 items-center justify-center rounded-full">
            🎯
          </span>
          <span className="text-foreground mt-1 font-mono text-2xl font-extrabold">
            {avgAccuracy}%
          </span>
          <span className="text-muted text-[11px] font-extrabold tracking-wider uppercase">
            Accuracy
          </span>
        </Card>
      </div>

      {/* Word-by-Word Breakdown */}
      <Card className="flex w-full flex-col gap-3 p-5 text-left">
        <h3 className="text-muted text-xs font-extrabold tracking-wider uppercase">
          Words Reviewed
        </h3>
        <ul className="divide-border/60 flex flex-col divide-y">
          {results.map((r, idx) => (
            <li
              key={`${r.word.id}-${idx}`}
              className="flex items-center justify-between py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    r.correct
                      ? "bg-success-bg text-success-fg"
                      : "bg-danger-bg text-danger-fg"
                  }`}
                >
                  {r.correct ? <CheckIcon size={14} /> : <XIcon size={14} />}
                </span>
                <span className="text-foreground font-mono text-base font-bold">
                  {r.word.word}
                </span>
                <span className="text-muted hidden max-w-[200px] truncate text-xs sm:inline">
                  — {r.word.definition}
                </span>
              </div>

              <span className="text-muted font-mono text-xs font-extrabold">
                {r.correct ? `+${r.pointsEarned} pts` : "Missed"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Action Buttons */}
      <div className="flex w-full flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="border-primary bg-primary text-on-primary inline-flex min-h-12 items-center justify-center rounded-2xl border-2 px-6 font-extrabold shadow-[0_4px_0_var(--primary-shadow)] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          Practice 10 More Words
        </button>

        <ButtonLink href="/" variant="secondary" size="md">
          Return to Home
        </ButtonLink>
      </div>
    </div>
  );
}
