import type { StreakResult } from "@/core/streak";
import { Card } from "@/components/ui/Card";
import { FlameIcon, CheckIcon } from "@/components/ui/icons";

export interface StreakCardProps {
  streak: StreakResult;
  className?: string;
}

export function StreakCard({ streak, className }: StreakCardProps) {
  const { currentStreak, hasPracticedToday, multiplier, recent7Days } = streak;

  return (
    <Card className={`flex h-full flex-col justify-between gap-4 p-5 ${className ?? ""}`}>
      <div className="flex flex-col gap-3">
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500">
              <FlameIcon size={16} />
            </div>
            <span className="text-muted text-xs font-black tracking-wider uppercase">
              Current Streak
            </span>
          </div>

          {multiplier > 1.0 && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-black whitespace-nowrap text-amber-600 dark:text-amber-400">
              {multiplier}× Boost
            </span>
          )}
        </div>

        {/* Big number stat */}
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-foreground text-3xl font-black">{currentStreak}</span>
          <span className="text-muted text-xs font-bold">
            {currentStreak === 1 ? "day active" : "days active"}
          </span>
        </div>

        {/* 7-Day Dots Calendar */}
        <div className="border-border/60 bg-background/50 flex items-center justify-between rounded-2xl border p-2.5">
          {recent7Days.map((day) => {
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[11px] font-extrabold uppercase ${
                    day.isToday ? "text-primary" : "text-muted"
                  }`}
                >
                  {day.dayName.slice(0, 1)}
                </span>

                <div
                  title={`${day.dayName}: ${day.practiced ? "Practiced" : "No practice"}`}
                  className={`flex size-6 items-center justify-center rounded-full border-2 transition-all ${
                    day.practiced
                      ? "border-success-border bg-success-bg text-success-fg scale-105"
                      : day.isToday
                        ? "border-primary/60 bg-primary/10 text-primary animate-pulse"
                        : "border-border/60 bg-card text-transparent"
                  }`}
                >
                  {day.practiced ? (
                    <CheckIcon size={12} />
                  ) : (
                    <span className="bg-border size-1 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status banner */}
      <div className="border-border/50 text-muted border-t pt-2 text-center text-xs font-semibold">
        {hasPracticedToday ? (
          <span className="text-success-fg flex items-center justify-center gap-1 font-extrabold">
            <CheckIcon size={12} /> Practiced today &bull; Streak safe
          </span>
        ) : (
          <span className="text-muted">Practice today to protect your streak!</span>
        )}
      </div>
    </Card>
  );
}
