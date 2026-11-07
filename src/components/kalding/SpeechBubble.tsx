import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Rounded speech bubble. `tail` says which side Kalding is on. */
export function SpeechBubble({
  children,
  tail = "left",
  className,
}: {
  children: ReactNode;
  tail?: "left" | "bottom" | "none";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card text-foreground relative rounded-2xl border-2 px-4 py-3 font-bold shadow-[0_3px_0_var(--secondary-shadow)]",
        className,
      )}
    >
      {children}
      {tail === "left" && (
        <span
          aria-hidden="true"
          className="border-border bg-card absolute top-1/2 -left-[9px] size-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2"
        />
      )}
      {tail === "bottom" && (
        <span
          aria-hidden="true"
          className="border-border bg-card absolute -bottom-[9px] left-8 size-4 rotate-45 border-r-2 border-b-2"
        />
      )}
    </div>
  );
}
