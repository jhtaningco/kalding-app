import Link from "next/link";
import { PointsChip } from "@/components/gamification/PointsChip";
import { StreakChip } from "@/components/gamification/StreakChip";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export type TopBarProps = {
  /** Session progress. When omitted, the bar shows the app name instead. */
  progress?: { value: number; max: number };
  streak: number;
  points: number;
  /** When set, shows an exit (X) link, used while practicing. */
  exitHref?: string;
  /** Hide the toggle where a forced-theme preview would make it misleading. */
  hideThemeToggle?: boolean;
  /** Sticky on real screens; static inside showcase panels. */
  sticky?: boolean;
  className?: string;
};

export function TopBar({
  progress,
  streak,
  points,
  exitHref,
  hideThemeToggle,
  sticky = true,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "border-border bg-background/95 z-30 border-b-2 backdrop-blur",
        sticky && "sticky top-0",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {exitHref && (
          <Link
            href={exitHref}
            aria-label="Exit practice"
            className="text-muted hover:bg-border/50 focus-visible:ring-focus inline-flex size-11 shrink-0 items-center justify-center rounded-2xl focus-visible:ring-4 focus-visible:outline-none"
          >
            <XIcon size={22} />
          </Link>
        )}

        {progress ? (
          <ProgressBar
            label="Session progress"
            value={progress.value}
            max={progress.max}
            className="min-w-12 flex-1"
          />
        ) : (
          <Link
            href="/"
            className="text-primary focus-visible:ring-focus flex-1 truncate rounded-lg text-lg font-extrabold focus-visible:ring-4 focus-visible:outline-none"
          >
            Kalding English
          </Link>
        )}

        <StreakChip days={streak} />
        <PointsChip points={points} />
        {!hideThemeToggle && <ThemeToggle />}
      </div>
    </header>
  );
}
