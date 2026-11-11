import type { DailyGoalProgress } from "@/core/dailyGoal";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StarIcon, CheckIcon } from "@/components/ui/icons";

export interface DailyGoalCardProps {
  progress: DailyGoalProgress;
  className?: string;
}

export function DailyGoalCard({ progress, className }: DailyGoalCardProps) {
  const { pointsToday, goalPoints, percent, isGoalMet, cheerMessage } = progress;

  return (
    <Card className={`flex h-full flex-col justify-between gap-4 p-5 ${className ?? ""}`}>
      <div className="flex flex-col gap-3">
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
              <StarIcon size={16} />
            </div>
            <span className="text-muted text-xs font-black tracking-wider uppercase">
              Daily Target
            </span>
          </div>

          {isGoalMet ? (
            <span className="border-success-border bg-success-bg text-success-fg flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black whitespace-nowrap">
              <CheckIcon size={12} /> Completed
            </span>
          ) : (
            <span className="border-border bg-background/60 text-muted rounded-full border px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap">
              {percent}%
            </span>
          )}
        </div>

        {/* Big number stat */}
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-foreground text-3xl font-black">{pointsToday}</span>
          <span className="text-muted text-xs font-bold">/ {goalPoints} pts</span>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={pointsToday}
          max={goalPoints}
          label="Daily goal points progress"
        />
      </div>

      {/* Cheer Message */}
      <p className="border-border/50 text-muted border-t pt-2 text-center text-xs font-semibold">
        {cheerMessage}
      </p>
    </Card>
  );
}
