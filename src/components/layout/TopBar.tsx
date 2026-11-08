import Link from "next/link";
import { PointsChip } from "@/components/gamification/PointsChip";
import { StreakChip } from "@/components/gamification/StreakChip";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { XIcon, UserIcon, GearIcon } from "@/components/ui/icons";
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
          <div className="flex flex-1 items-center gap-3 truncate">
            <Link
              href="/"
              className="text-primary focus-visible:ring-focus truncate rounded-lg text-lg font-extrabold focus-visible:ring-4 focus-visible:outline-none"
            >
              Kalding
            </Link>

            <nav className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/practice"
                className="text-muted hover:text-foreground rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
              >
                Practice
              </Link>
              <Link
                href="/review"
                className="text-muted hover:text-foreground rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
              >
                Review
              </Link>
              <Link
                href="/words"
                className="text-muted hover:text-foreground rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
              >
                Words
              </Link>
            </nav>
          </div>
        )}

        <StreakChip days={streak} />
        <PointsChip points={points} />

        {!progress && (
          <div className="flex items-center gap-1">
            <Link
              href="/profile"
              aria-label="Learner Profile"
              title="Profile & Stats"
              className="text-muted hover:bg-border/40 hover:text-foreground inline-flex size-9 items-center justify-center rounded-xl transition-colors"
            >
              <UserIcon size={18} />
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings & Preferences"
              className="text-muted hover:bg-border/40 hover:text-foreground inline-flex size-9 items-center justify-center rounded-xl transition-colors"
            >
              <GearIcon size={18} />
            </Link>
          </div>
        )}

        {!hideThemeToggle && <ThemeToggle />}
      </div>
    </header>
  );
}
