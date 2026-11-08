import { Button } from "@/components/ui/Button";
import { CheckIcon, LightbulbIcon, XIcon } from "@/components/ui/icons";

export type FeedbackBarProps = {
  status: "idle" | "correct" | "wrong";
  canCheck: boolean;
  onCheck: () => void;
  onSkip: () => void;
  onHint: () => void;
  onNext: () => void;
  hintDisabled?: boolean;
};

export function FeedbackBar({
  status,
  canCheck,
  onCheck,
  onSkip,
  onHint,
  onNext,
  hintDisabled = false,
}: FeedbackBarProps) {
  const isAnswered = status !== "idle";

  return (
    <footer
      className={`border-border sticky bottom-0 z-20 w-full border-t-2 p-4 backdrop-blur-md transition-colors ${
        status === "correct"
          ? "border-success-border bg-success-bg/95"
          : status === "wrong"
            ? "border-danger-border bg-danger-bg/95"
            : "bg-background/95"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        {!isAnswered ? (
          <>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="md" onClick={onSkip} aria-label="Skip word">
                <span>Skip</span>
                <span className="hidden text-[11px] opacity-60 sm:inline">[Esc]</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onHint}
                disabled={hintDisabled}
                title="Reveal a letter hint (Alt+H)"
              >
                <LightbulbIcon size={18} />
                <span className="hidden sm:inline">Hint</span>
                <span className="hidden text-[11px] opacity-60 md:inline">[Alt+H]</span>
              </Button>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={!canCheck}
              onClick={onCheck}
              className="min-w-[140px]"
            >
              <span>Check</span>
              <span className="hidden text-xs opacity-75 sm:inline">[Enter]</span>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {status === "correct" ? (
                <div className="text-success-fg flex items-center gap-2 font-extrabold">
                  <span className="bg-success-fg text-on-primary inline-flex size-9 items-center justify-center rounded-2xl">
                    <CheckIcon size={20} />
                  </span>
                  <span className="text-base sm:text-lg">Great job!</span>
                </div>
              ) : (
                <div className="text-danger-fg flex items-center gap-2 font-extrabold">
                  <span className="bg-danger-fg text-on-primary inline-flex size-9 items-center justify-center rounded-2xl">
                    <XIcon size={20} />
                  </span>
                  <span className="text-base sm:text-lg">Keep going!</span>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={onNext}
              className="animate-pop min-w-[160px]"
            >
              Continue{" "}
              <span className="hidden text-xs opacity-75 sm:inline">[Enter]</span>
            </Button>
          </>
        )}
      </div>
    </footer>
  );
}
