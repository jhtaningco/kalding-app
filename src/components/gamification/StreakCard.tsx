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
    <Card className={`flex flex-col gap-4 p-5 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 text-amber-500">
            <FlameIcon size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-muted text-xs font-black tracking-wider uppercase">
              Current Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-foreground text-2xl font-black">{currentStreak}</span>
              <span className="text-muted text-xs font-bold">
                {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>

        {multiplier > 1.0 && (
          <span className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full border px-2.5 py-0.5 text-xs font-black">
            {multiplier}× Boost
          </span>
        )}
      </div>

      {/* 7-Day Dots Calendar */}
      <div className="border-border/60 bg-background/50 flex items-center justify-between rounded-2xl border p-3">
        {recent7Days.map((day) => {
          return (
            <div key={day.date} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[11px] font-extrabold uppercase ${
                  day.isToday ? "text-primary" : "text-muted"
                }`}
              >
                {day.dayName.slice(0, 1)}
              </span>

              <div
                title={`${day.dayName}: ${day.practiced ? "Practiced" : "No practice"}`}
                className={`flex size-7 items-center justify-center rounded-full border-2 transition-all ${
                  day.practiced
                    ? "border-success-border bg-success-bg text-success-fg scale-105"
                    : day.isToday
                      ? "border-primary/60 bg-primary/10 text-primary animate-pulse"
                      : "border-border/60 bg-card text-transparent"
                }`}
              >
                {day.practiced ? (
                  <CheckIcon size={14} />
                ) : (
                  <span className="size-1.5 rounded-full bg-border" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status banner */}
      <div className="text-muted text-center text-xs font-semibold">
        {hasPracticedToday ? (
          <span className="text-success-fg font-extrabold">
            ✓ You practiced today! Streak protected.
          </span>
        ) : (
          <span>Practice a session today to keep your streak burning!</span>
        )}
      </div>
    </Card>
  );
}
