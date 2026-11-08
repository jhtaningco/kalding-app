import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "default" | "success" | "danger";

const tones: Record<CardTone, string> = {
  default:
    "border-border bg-card text-foreground shadow-[0_4px_0_var(--secondary-shadow)]",
  success:
    "border-success-border bg-success-bg text-success-fg shadow-[0_4px_0_var(--success-border)]",
  danger:
    "border-danger-border bg-danger-bg text-danger-fg shadow-[0_4px_0_var(--danger-border)]",
};

export type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: CardTone };

export function Card({ tone = "default", className, ...props }: CardProps) {
  return (
    <div className={cn("rounded-3xl border-2 p-6", tones[tone], className)} {...props} />
  );
}
