"use client";

import { useState } from "react";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type Result = "idle" | "correct" | "wrong";

const mood: Record<Result, KaldingMood> = {
  idle: "neutral",
  correct: "happy",
  wrong: "oops",
};

const message: Record<Result, string> = {
  idle: "Type the word that matches the definition.",
  correct: "Nice one! +10 points.",
  wrong: "Close! The word was resilient. Try it again soon.",
};

/** Tries the bounce / shake animations and the mood mapping. Real logic comes in Phase 4. */
export function FeedbackDemo() {
  const [result, setResult] = useState<Result>("idle");
  const [run, setRun] = useState(0);

  const show = (next: Result) => {
    setResult(next);
    setRun((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Kalding mood={mood[result]} size={88} title={`Kalding is ${mood[result]}`} />
        <SpeechBubble>{message[result]}</SpeechBubble>
      </div>
      <Card
        key={run}
        tone={
          result === "correct" ? "success" : result === "wrong" ? "danger" : "default"
        }
        className={cn(
          "text-center text-lg font-bold",
          result === "correct" && "animate-pop",
          result === "wrong" && "animate-shake",
        )}
      >
        able to recover quickly from difficulties
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button size="sm" onClick={() => show("correct")}>
          Correct
        </Button>
        <Button size="sm" variant="secondary" onClick={() => show("wrong")}>
          Wrong
        </Button>
        <Button size="sm" variant="ghost" onClick={() => show("idle")}>
          Reset
        </Button>
      </div>
    </div>
  );
}
