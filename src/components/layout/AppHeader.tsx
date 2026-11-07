"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./TopBar";

export interface AppHeaderProps {
  streak?: number;
  points?: number;
}

export function AppHeader({ streak = 0, points = 0 }: AppHeaderProps) {
  const pathname = usePathname();

  // Hide the global navigation TopBar when inside an active practice session
  // (e.g., /practice/def_to_word, /practice/type_def, /practice/word_rush)
  // because the practice engine provides its own dedicated session TopBar with progress bar and exit button.
  if (pathname?.startsWith("/practice/") && pathname !== "/practice") {
    return null;
  }

  return <TopBar streak={streak} points={points} />;
}
