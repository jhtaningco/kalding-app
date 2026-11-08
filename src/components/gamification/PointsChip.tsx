import { Chip } from "@/components/ui/Chip";
import { StarIcon } from "@/components/ui/icons";

export function PointsChip({
  points,
  className,
}: {
  points: number;
  className?: string;
}) {
  return (
    <Chip variant="points" className={className}>
      <StarIcon size={18} />
      <span>
        <span className="sr-only">Points: </span>
        {points}
      </span>
    </Chip>
  );
}
