import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ChipVariant = "neutral" | "mode" | "streak" | "points";

const variants: Record<ChipVariant, string> = {
  neutral: "border-border bg-card text-muted",
  mode: "border-success-border bg-success-bg text-success-fg",
  streak: "border-transparent bg-streak-bg text-streak-fg",
  points: "border-transparent bg-points-bg text-points-fg",
};

export type ChipProps = HTMLAttributes<HTMLSpanElement> & { variant?: ChipVariant };

export function Chip({ variant = "neutral", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-extrabold tabular-nums",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
