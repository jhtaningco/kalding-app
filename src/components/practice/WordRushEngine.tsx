"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Tables } from "@/types/database";
import { evaluateStreamSession, checkStreamWord, type StreamSessionResult } from "@/core/streamTyping";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { createClient } from "@/lib/supabase/client";
import { recordWordAttempt } from "@/lib/srs/recordAttempt";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

export interface WordRushEngineProps {
  words: Tables<"words">[];
  initialPoints?: number;
  initialStreak?: number;
  userId?: string;
}

export function WordRushEngine({
  words,
  initialPoints = 0,
  initialStreak = 0,
  userId,
}: WordRushEngineProps) {
  // Use up to 20 words for the rush session
  const targetWords = useMemo(() => words.slice(0, 20), [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [typedHistory, setTypedHistory] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const supabase = createClient();

  // Focus input automatically
  useEffect(() => {
    if (!isCompleted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCompleted, currentIndex]);

  // Timer interval while typing
  useEffect(() => {
    if (!hasStarted || isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isCompleted]);

  const handleContainerClick = () => {
    if (!isCompleted && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasStarted) {
      setHasStarted(true);
      startTimeRef.current = Date.now();
    }

    const val = e.target.value;

    // Spacebar or Enter advances immediately to the next word
    if (val.endsWith(" ") || val.endsWith("\n")) {
      const submittedWord = val.trim();
      const currentTarget = targetWords[currentIndex]?.word || "";

      const check = checkStreamWord(currentTarget, submittedWord);
      if (check.isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }

      const nextHistory = [...typedHistory, submittedWord];
      setTypedHistory(nextHistory);
      setCurrentInput("");

      // Record to database asynchronously
      if (userId && targetWords[currentIndex]) {
        recordWordAttempt({
          supabase,
          userId,
          wordId: targetWords[currentIndex].id,
          mode: "word_rush",
          correct: check.isCorrect,
          typedText: submittedWord,
          timeMs: 1500,
          accuracy: check.isCorrect ? 100 : 50,
          pointsEarned: check.isCorrect ? 5 : 0,
          language: "en",
        }).catch((err) => console.warn("Failed to persist rush word:", err));
      }

      if (currentIndex + 1 < targetWords.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
      return;
    }

    setCurrentInput(val);
  };

  // Compute live metrics
  const sessionResult: StreamSessionResult = useMemo(() => {
    const elapsedMs = Math.max(1000, elapsedSeconds * 1000);
    return evaluateStreamSession(
      targetWords.map((w) => w.word),
      typedHistory,
      elapsedMs,
    );
  }, [targetWords, typedHistory, elapsedSeconds]);

  // Session Summary Screen
  if (isCompleted) {
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar
          points={initialPoints + sessionResult.pointsEarned}
          streak={initialStreak}
          progress={{ value: targetWords.length, max: targetWords.length }}
          exitHref="/practice"
        />

        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center animate-fade-in">
          <Kalding mood="celebrate" size={130} title="Kalding celebrating Word Rush!" />

          <SpeechBubble className="text-base font-black">
            Incredible burst speed! You finished the Word Rush with{" "}
            <span className="text-primary">{sessionResult.netWpm} WPM</span>!
          </SpeechBubble>

          {/* Results Summary Card */}
          <Card className="flex w-full flex-col gap-5 p-6 text-center sm:p-8">
            <div className="flex flex-col gap-1">
              <span className="text-muted text-xs font-black uppercase tracking-wider">
                Word Rush Results
              </span>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-primary text-5xl font-black">{sessionResult.netWpm}</span>
                <span className="text-muted text-lg font-bold">Net WPM</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-y-2 border-border/80 py-4">
              <div className="flex flex-col">
                <span className="text-foreground text-xl font-black">
                  {sessionResult.accuracy}%
                </span>
                <span className="text-muted text-xs font-bold uppercase">Accuracy</span>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-xl font-black">
                  {sessionResult.correctWords}/{sessionResult.totalWords}
                </span>
                <span className="text-muted text-xs font-bold uppercase">Words Correct</span>
              </div>
              <div className="flex flex-col">
                <span className="text-success-fg text-xl font-black">
                  +{sessionResult.pointsEarned}
                </span>
                <span className="text-muted text-xs font-bold uppercase">XP Earned</span>
              </div>
            </div>

            {/* Word Breakdown Chips */}
            <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto p-1">
              {sessionResult.wordResults.map((r, i) => (
                <span
                  key={i}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                    r.isCorrect
                      ? "border-success-border bg-success-bg text-success-fg border"
                      : "border-danger-border bg-danger-bg text-danger-fg border line-through"
                  }`}
                >
                  {r.targetWord}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  setCurrentIndex(0);
                  setCurrentInput("");
                  setTypedHistory([]);
                  setIsCompleted(false);
                  setElapsedSeconds(0);
                  setHasStarted(false);
                }}
              >
                Play Again
              </Button>
              <ButtonLink href="/practice" variant="secondary" size="lg">
                Back to Arena
              </ButtonLink>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const currentTargetWord = targetWords[currentIndex]?.word || "";

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        points={initialPoints}
        streak={initialStreak}
        progress={{ value: currentIndex, max: targetWords.length }}
        exitHref="/practice"
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:py-10">
        {/* Speedometer & Progress Bar */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="border-primary/40 bg-primary/10 text-primary flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black">
              ⚡ {sessionResult.netWpm} WPM
            </span>
            <span className="border-border bg-card text-muted rounded-full border px-3 py-1 text-xs font-black">
              {sessionResult.accuracy}% Accuracy
            </span>
          </div>

          <span className="text-muted text-xs font-black">
            Word {currentIndex + 1} of {targetWords.length}
          </span>
        </div>

        {/* Mascot & Prompt */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <Kalding mood="streak" size={90} title="Kalding cheering your speed!" />
          <SpeechBubble className="text-sm font-bold sm:text-base">
            Type each word and press <strong className="text-primary">Spacebar</strong> to advance!
          </SpeechBubble>
        </div>

        {/* Word Stream Conveyor Belt Card */}
        <div
          onClick={handleContainerClick}
          className="border-primary/40 bg-card hover:border-primary relative flex w-full cursor-text flex-col items-center gap-6 rounded-3xl border-2 p-8 shadow-sm transition-all sm:p-10"
        >
          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="absolute inset-0 size-full opacity-0 pointer-events-none -z-10"
            aria-label="Word rush typing input"
          />

          {/* Previous Words Faded */}
          <div className="flex items-center gap-2 overflow-hidden text-sm font-bold opacity-60">
            {typedHistory.slice(-3).map((w, i) => (
              <span key={i} className="text-muted">
                {w}
              </span>
            ))}
          </div>

          {/* Current Target Word with Letter Boxes */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-1.5 font-mono text-3xl font-black sm:text-4xl md:text-5xl">
              {currentTargetWord.split("").map((char, idx) => {
                const isTyped = idx < currentInput.length;
                const typedChar = currentInput[idx];
                const isCurrent = idx === currentInput.length;
                const isCorrect = isTyped && typedChar.toLowerCase() === char.toLowerCase();
                const isWrong = isTyped && !isCorrect;

                return (
                  <span
                    key={idx}
                    className={`relative flex min-w-[28px] sm:min-w-[36px] justify-center border-b-4 pb-1 transition-colors ${
                      isCorrect
                        ? "border-success-border text-success-fg"
                        : isWrong
                          ? "border-danger-border text-danger-fg"
                          : isCurrent
                            ? "border-primary text-foreground animate-pulse"
                            : "border-border/60 text-muted/60"
                    }`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>

            {targetWords[currentIndex] && (
              <span className="text-muted text-xs italic">
                ({targetWords[currentIndex].part_of_speech}) {targetWords[currentIndex].definition}
              </span>
            )}
          </div>

          {/* Upcoming Words Preview */}
          <div className="flex items-center gap-3 text-muted/50 text-base font-bold select-none">
            {targetWords.slice(currentIndex + 1, currentIndex + 4).map((w) => (
              <span key={w.id}>{w.word}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
