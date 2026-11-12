"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopBar } from "./TopBar";

export interface AppHeaderProps {
  streak?: number;
  points?: number;
}

export function AppHeader({ streak = 0, points = 0 }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prevPathnameRef = useRef(pathname);

  const [eventPoints, setEventPoints] = useState<number | null>(null);
  const [eventStreak, setEventStreak] = useState<number | null>(null);

  // When returning to a navigation page from a practice/daily session,
  // immediately refresh server components to fetch latest XP and streak.
  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (
      prev &&
      (prev.startsWith("/practice/") || prev === "/daily" || prev === "/review") &&
      pathname !== prev
    ) {
      setEventPoints(null);
      setEventStreak(null);
      router.refresh();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, router]);

  // Listen for live point updates dispatched from active sessions
  useEffect(() => {
    const handlePointsUpdate = (e: CustomEvent<{ points?: number; streak?: number }>) => {
      if (typeof e.detail?.points === "number") {
        setEventPoints(e.detail.points);
      }
      if (typeof e.detail?.streak === "number") {
        setEventStreak(e.detail.streak);
      }
    };

    window.addEventListener(
      "kalding:points-updated" as string,
      handlePointsUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "kalding:points-updated" as string,
        handlePointsUpdate as EventListener,
      );
    };
  }, []);

  // Hide the global navigation TopBar when inside an active practice or daily session
  // (e.g., /practice/def_to_word, /daily)
  // because the exercise engines provide their own dedicated session TopBar with progress bar and exit button.
  if (
    (pathname?.startsWith("/practice/") && pathname !== "/practice") ||
    pathname === "/daily"
  ) {
    return null;
  }

  const activePoints = eventPoints !== null ? eventPoints : points;
  const activeStreak = eventStreak !== null ? eventStreak : streak;

  return <TopBar streak={activeStreak} points={activePoints} />;
}
