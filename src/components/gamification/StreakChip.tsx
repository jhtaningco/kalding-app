import { Chip } from "@/components/ui/Chip";
import { FlameIcon } from "@/components/ui/icons";

export function StreakChip({ days, className }: { days: number; className?: string }) {
  return (
    <Chip variant="streak" className={className}>
      <FlameIcon size={18} />
      <span>
        <span className="sr-only">Streak: </span>
        {days}
        <span className="sr-only"> {days === 1 ? "day" : "days"}</span>
      </span>
    </Chip>
  );
}
