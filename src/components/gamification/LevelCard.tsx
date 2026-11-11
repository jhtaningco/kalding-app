import type { LevelInfo } from "@/core/levels";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BookOpenIcon } from "@/components/ui/icons";

export interface LevelCardProps {
  levelInfo: LevelInfo;
  className?: string;
}

export function LevelCard({ levelInfo, className }: LevelCardProps) {
  const { level, title, totalXp, currentLevelXp, xpNeededForNextLevel, progressPercent } =
    levelInfo;

  return (
    <Card className={`flex h-full flex-col justify-between gap-4 p-5 ${className ?? ""}`}>
      <div className="flex flex-col gap-3">
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="border-primary/40 bg-primary/10 text-primary flex size-8 items-center justify-center rounded-xl border">
              <BookOpenIcon size={16} />
            </div>
            <span className="text-muted text-xs font-black tracking-wider uppercase">
              Current Rank
            </span>
          </div>

          <span className="border-border bg-background/60 text-muted rounded-full border px-2 py-0.5 text-xs font-extrabold whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>

        {/* Level and Title Row */}
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-foreground text-3xl font-black">Level {level}</span>
          <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-xs font-black tracking-wide whitespace-nowrap uppercase">
            {title}
          </span>
        </div>

        {/* Level XP Progress Bar */}
        <ProgressBar
          value={currentLevelXp}
          max={xpNeededForNextLevel}
          label={`Level ${level} XP progress`}
        />
      </div>

      {/* Subtext info */}
      <div className="border-border/50 text-muted flex items-center justify-between border-t pt-2 text-xs font-semibold">
        <span>{totalXp} Lifetime XP</span>
        <span>
          {Math.max(0, xpNeededForNextLevel - currentLevelXp)} XP to Level {level + 1}
        </span>
      </div>
    </Card>
  );
}
