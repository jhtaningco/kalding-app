import type { LevelInfo } from "@/core/levels";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BookOpenIcon } from "@/components/ui/icons";

export interface LevelCardProps {
  levelInfo: LevelInfo;
  className?: string;
}

export function LevelCard({ levelInfo, className }: LevelCardProps) {
  const {
    level,
    title,
    totalXp,
    currentLevelXp,
    xpNeededForNextLevel,
    progressPercent,
  } = levelInfo;

  return (
    <Card className={`flex flex-col gap-4 p-5 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl border-2 border-primary/40 bg-primary/10 text-primary">
            <BookOpenIcon size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-xl font-black">Level {level}</span>
              <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2 py-0.2 text-[11px] font-black uppercase">
                {title}
              </span>
            </div>
            <span className="text-muted text-xs font-bold">
              {totalXp} Lifetime XP earned
            </span>
          </div>
        </div>

        <span className="text-muted text-xs font-extrabold">{progressPercent}%</span>
      </div>

      {/* Level XP Progress Bar */}
      <ProgressBar
        value={currentLevelXp}
        max={xpNeededForNextLevel}
        label={`Level ${level} XP progress`}
      />

      <div className="flex items-center justify-between text-muted text-xs font-semibold">
        <span>{currentLevelXp} XP in level</span>
        <span>{xpNeededForNextLevel - currentLevelXp} XP to Level {level + 1}</span>
      </div>
    </Card>
  );
}
