"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateTypingAccuracy, isWordAnswerCorrect } from "@/core/checkAnswer";
import { calculateScore } from "@/core/scoring";
import { createClient } from "@/lib/supabase/client";
import { recordWordAttempt } from "@/lib/srs/recordAttempt";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { Tables } from "@/types/database";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { TopBar } from "@/components/layout/TopBar";
import { Chip } from "@/components/ui/Chip";
import { FeedbackBar } from "@/components/practice/FeedbackBar";
import { PromptCard } from "@/components/practice/PromptCard";
import { SessionSummary, type SessionResult } from "@/components/practice/SessionSummary";
import { TypingArea } from "@/components/practice/TypingArea";

export type PracticeEngineProps = {
  words: Tables<"words">[];
  modeName: string;
  initialPoints?: number;
  initialStreak?: number;
  userId?: string;
};

type WordExerciseProps = {
  word: Tables<"words">;
  modeName: string;
  streakDays: number;
  onFinishWord: (result: SessionResult) => void;
};

function WordExercise({ word, modeName, streakDays, onFinishWord }: WordExerciseProps) {
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [mistakeCount, setMistakeCount] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);

  const startTimeRef = useRef<number>(0);
  const pendingResultRef = useRef<SessionResult | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const handleNext = useCallback(() => {
    if (pendingResultRef.current) {
      onFinishWord(pendingResultRef.current);
    }
  }, [onFinishWord]);

  // Global Enter listener to advance when in feedback state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && status !== "idle") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, handleNext]);

  // Kalding mood mapping
  let mood: KaldingMood = "neutral";
  let speechText = "Type the word that matches the definition!";

  if (usedHint && status === "idle") {
    mood = "thinking";
    speechText = `Here's a clue: starts with "${revealedLetters}"!`;
  } else if (status === "correct") {
    mood = "happy";
    speechText = `Spot on! +${pointsEarned} points!`;
  } else if (status === "wrong") {
    mood = "oops";
    speechText = `Good effort! The correct word was "${word.word}".`;
  }

  const handleMistake = () => {
    setMistakeCount((prev) => prev + 1);
  };

  const handleHint = () => {
    setUsedHint(true);
    const nextRevealedLength = revealedLetters.length + 1;
    const hintStr = word.word.slice(0, nextRevealedLength);
    setRevealedLetters(hintStr);
    if (!typedText.startsWith(hintStr)) {
      setTypedText(hintStr);
    }
  };

  const handleCheck = () => {
    if (status !== "idle") return;

    const startedAt = startTimeRef.current || Date.now();
    const timeMs = Math.max(200, Date.now() - startedAt);
    const isCorrect = isWordAnswerCorrect(word.word, typedText);
    const accuracy = calculateTypingAccuracy(word.word.length, mistakeCount);

    const score = calculateScore({
      correct: isCorrect,
      targetWord: word.word,
      timeMs,
      mistakeCount,
      usedHint,
      streakDays,
    });

    if (isCorrect) {
      playCorrectSound();
      setStatus("correct");
      setPointsEarned(score.totalPoints);
    } else {
      playWrongSound();
      setStatus("wrong");
      setPointsEarned(0);
    }

    pendingResultRef.current = {
      word,
      correct: isCorrect,
      pointsEarned: score.totalPoints,
      timeMs,
      accuracy,
    };
  };

  const handleSkip = () => {
    if (status !== "idle") return;

    playWrongSound();
    setStatus("wrong");
    setPointsEarned(0);

    const startedAt = startTimeRef.current || Date.now();
    const timeMs = Math.max(200, Date.now() - startedAt);

    pendingResultRef.current = {
      word,
      correct: false,
      pointsEarned: 0,
      timeMs,
      accuracy: 0,
    };
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:py-8">
        <Chip variant="mode" className="text-xs tracking-wider uppercase">
          {modeName}
        </Chip>

        <div className="flex items-center gap-3">
          <Kalding mood={mood} size={92} title={`Kalding is ${mood}`} />
          <SpeechBubble className="text-sm font-bold sm:text-base">
            {speechText}
          </SpeechBubble>
        </div>

        <PromptCard
          word={word}
          status={status}
          revealedLetters={revealedLetters}
          pointsEarned={pointsEarned}
        />

        <TypingArea
          targetWord={word.word}
          typedText={typedText}
          onChange={setTypedText}
          onSubmit={status === "idle" ? handleCheck : handleNext}
          onMistake={handleMistake}
          disabled={status !== "idle"}
        />
      </main>

      <FeedbackBar
        status={status}
        canCheck={typedText.trim().length > 0}
        onCheck={handleCheck}
        onSkip={handleSkip}
        onHint={handleHint}
        onNext={handleNext}
        hintDisabled={status !== "idle" || revealedLetters.length >= word.word.length}
      />
    </>
  );
}

export function PracticeEngine({
  words,
  modeName,
  initialPoints = 0,
  initialStreak = 0,
  userId,
}: PracticeEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const supabase = createClient();
  const currentWord = words[currentIndex];

  const handleFinishWord = useCallback(
    (res: SessionResult) => {
      setSessionPoints((prev) => prev + res.pointsEarned);
      setResults((prev) => [...prev, res]);

      // Save attempt to Supabase and update SRS user_words progress
      if (userId) {
        recordWordAttempt({
          supabase,
          userId,
          wordId: res.word.id,
          mode: "def_to_word",
          correct: res.correct,
          typedText: res.word.word,
          timeMs: res.timeMs,
          accuracy: res.accuracy,
          pointsEarned: res.pointsEarned,
          language: res.word.language || "en",
        }).catch((err) => {
          console.warn("Failed to persist attempt/SRS:", err);
        });
      }

      if (currentIndex + 1 < words.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    },
    [currentIndex, words.length, userId, supabase],
  );

  if (!currentWord || isCompleted) {
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar
          points={initialPoints + sessionPoints}
          streak={initialStreak}
          progress={{ value: words.length, max: words.length }}
          exitHref="/"
        />
        <main className="flex flex-1 items-center justify-center py-8">
          <SessionSummary
            results={results}
            totalPoints={sessionPoints}
            onRestart={() => {
              setCurrentIndex(0);
              setSessionPoints(0);
              setResults([]);
              setIsCompleted(false);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        points={initialPoints + sessionPoints}
        streak={initialStreak}
        progress={{ value: currentIndex + 1, max: words.length }}
        exitHref="/"
      />

      <WordExercise
        key={currentWord.id}
        word={currentWord}
        modeName={modeName}
        streakDays={initialStreak}
        onFinishWord={handleFinishWord}
      />
    </div>
  );
}
