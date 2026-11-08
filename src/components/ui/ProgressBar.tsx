import { cn } from "@/lib/cn";

export type ProgressBarProps = {
  value: number;
  max?: number;
  /** Accessible name, e.g. "Session progress" or "Daily goal". */
  label: string;
  size?: "sm" | "md";
  className?: string;
};

export function ProgressBar({
  value,
  max = 100,
  label,
  size = "md",
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn(
        "bg-progress-track w-full overflow-hidden rounded-full",
        size === "sm" ? "h-3" : "h-4",
        className,
      )}
    >
      <div
        className="bg-progress relative h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%`, minWidth: percent > 0 ? "0.75rem" : 0 }}
      >
        {/* Soft highlight stripe for the chunky, glossy look. */}
        <span className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/30" />
      </div>
    </div>
  );
}
