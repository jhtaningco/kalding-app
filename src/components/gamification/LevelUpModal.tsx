"use client";

import { useEffect, useState } from "react";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/icons";
import { playLevelUpSound } from "@/lib/sounds";

export interface LevelUpModalProps {
  newLevel: number;
  newTitle: string;
  onClose: () => void;
}

export function LevelUpModal({ newLevel, newTitle, onClose }: LevelUpModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    playLevelUpSound();

    // Escape key closes modal
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border-border flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border-2 p-6 text-center shadow-2xl sm:p-8 animate-pop">
        {/* Celebration Mascot */}
        <Kalding mood="celebrate" size={130} title="Kalding celebrating level up!" />

        <SpeechBubble className="text-base font-extrabold text-foreground">
          You leveled up! You are now a <span className="text-primary font-black">{newTitle}</span>!
        </SpeechBubble>

        {/* Level Badge */}
        <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-primary/50 bg-primary/10 px-6 py-3">
          <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider">
            <StarIcon size={16} /> New Rank Unlocked
          </div>
          <span className="text-foreground text-3xl font-black">Level {newLevel}</span>
        </div>

        <Button
          size="lg"
          onClick={() => {
            setIsOpen(false);
            onClose();
          }}
          className="w-full text-base"
        >
          Keep Practicing!
        </Button>
      </div>
    </div>
  );
}
