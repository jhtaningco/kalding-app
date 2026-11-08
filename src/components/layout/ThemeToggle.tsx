"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

/**
 * Light/dark switch. The icon is swapped with CSS (`dark:` variant), so it is
 * correct on first paint; `aria-checked` follows the hook after hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark mode"
      onClick={toggleTheme}
      className={cn(
        "border-border bg-card text-foreground inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border-2",
        "shadow-[0_3px_0_var(--secondary-shadow)] transition-[transform,box-shadow] duration-100 active:translate-y-[3px] active:shadow-none",
        "focus-visible:ring-focus focus-visible:ring-offset-background focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <MoonIcon size={22} className="dark:hidden" />
      <SunIcon size={22} className="hidden dark:block" />
    </button>
  );
}
