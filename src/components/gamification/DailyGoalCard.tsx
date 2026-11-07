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
    <Card className={`flex flex-col gap-4 p-5 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
            <StarIcon size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-muted text-xs font-black tracking-wider uppercase">
              Daily Target
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-foreground text-2xl font-black">{pointsToday}</span>
              <span className="text-muted text-xs font-bold">/ {goalPoints} pts</span>
            </div>
          </div>
        </div>

        {isGoalMet ? (
          <span className="border-success-border bg-success-bg text-success-fg flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black">
            <CheckIcon size={13} /> Completed
          </span>
        ) : (
          <span className="border-border bg-background/60 text-muted rounded-full border px-2.5 py-0.5 text-xs font-extrabold">
            {percent}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={pointsToday}
        max={goalPoints}
        label="Daily goal points progress"
      />

      {/* Cheer Message */}
      <p className="text-muted text-center text-xs font-semibold">{cheerMessage}</p>
    </Card>
  );
}
