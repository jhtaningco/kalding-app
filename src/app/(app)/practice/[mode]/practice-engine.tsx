"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateTypingAccuracy, isWordAnswerCorrect } from "@/core/checkAnswer";
import { calculateScore } from "@/core/scoring";
import { calculateWpm } from "@/core/wpm";
import { createClient } from "@/lib/supabase/client";
import { recordWordAttempt } from "@/lib/srs/recordAttempt";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import type { Tables } from "@/types/database";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { TopBar } from "@/components/layout/TopBar";
import { Chip } from "@/components/ui/Chip";
import { FeedbackBar } from "@/components/practice/FeedbackBar";
import { PromptCard, type PracticeMode } from "@/components/practice/PromptCard";
import { SessionSummary, type SessionResult } from "@/components/practice/SessionSummary";
import { TypingArea } from "@/components/practice/TypingArea";
import { SentenceTypingArea } from "@/components/practice/SentenceTypingArea";

export type PracticeEngineProps = {
  words: Tables<"words">[];
  mode?: PracticeMode;
  modeName: string;
  initialPoints?: number;
  initialStreak?: number;
  userId?: string;
};

type WordExerciseProps = {
  word: Tables<"words">;
  mode: PracticeMode;
  modeName: string;
  streakDays: number;
  onFinishWord: (result: SessionResult) => void;
  liveWpm?: number;
};

interface GradeResponse {
  score: number;
  passed: boolean;
  feedback: string;
  keyConceptsMatched: string[];
  missingConcepts: string[];
  gradedBy?: string;
}

function WordExercise({
  word,
  mode,
  modeName,
  streakDays,
  onFinishWord,
  liveWpm,
}: WordExerciseProps) {
  const [typedText, setTypedText] = useState("");
  const [definitionExplanation, setDefinitionExplanation] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [mistakeCount, setMistakeCount] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [revealedLetters, setRevealedLetters] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeFeedback, setGradeFeedback] = useState<GradeResponse | null>(null);

  const isSentenceMode = mode === "type_def" || mode === "sentence_type";
  const sentenceTarget =
    mode === "type_def"
      ? word.definition
      : word.example_sentence || word.definition;

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



  // Kalding mood and speech mapping per mode
  let mood: KaldingMood = "neutral";
  let speechText = "";

  if (mode === "type_def") {
    speechText = "Type out the complete definition word-for-word!";
  } else if (mode === "sentence_type") {
    speechText = "Transcribe the context sentence with punctuation!";
  } else if (mode === "word_to_def") {
    speechText = "Explain this word in your own words!";
  } else if (mode === "fill_blank") {
    speechText = "Fill in the missing word in the sentence!";
  } else if (mode === "dictation") {
    speechText = "Listen to the pronunciation and type what you hear!";
  } else if (mode === "speed_run") {
    speechText = "Speed Run! Type quickly and accurately.";
  } else {
    speechText = "Type the word that matches the definition!";
  }

  if (isGrading) {
    mood = "thinking";
    speechText = "Kalding is evaluating your explanation...";
  } else if (usedHint && status === "idle") {
    mood = "thinking";
    speechText = `Here's a clue: starts with "${revealedLetters}"!`;
  } else if (status === "correct") {
    mood = "happy";
    speechText =
      mode === "word_to_def"
        ? gradeFeedback?.feedback || "Great explanation! You captured the definition."
        : pointsEarned > 15
          ? "Magnificent typing! Perfect speed and accuracy!"
          : "Spot on! That's correct.";
  } else if (status === "wrong") {
    mood = "oops";
    speechText =
      mode === "word_to_def"
        ? gradeFeedback?.feedback || `Notice the key meaning of "${word.word}".`
        : `Almost! The target was "${isSentenceMode ? sentenceTarget : word.word}".`;
  }

  const handleMistake = () => {
    setMistakeCount((prev) => prev + 1);
  };

  const handleHint = useCallback(() => {
    setUsedHint(true);
    const target = isSentenceMode ? sentenceTarget : word.word;
    const nextRevealedLength = revealedLetters.length + 1;
    const hintStr = target.slice(0, nextRevealedLength);
    setRevealedLetters(hintStr);
    if (!typedText.startsWith(hintStr)) {
      setTypedText(hintStr);
    }
  }, [isSentenceMode, sentenceTarget, word.word, revealedLetters, typedText]);

  const handleCheck = async (overrideText?: string) => {
    if (status !== "idle" || isGrading) return;

    const startedAt = startTimeRef.current || Date.now();
    const timeMs = Math.max(200, Date.now() - startedAt);
    const textToEvaluate = typeof overrideText === "string" ? overrideText : typedText;

    // 1. Word to Definition AI mode
    if (mode === "word_to_def") {
      setIsGrading(true);
      try {
        const res = await fetch("/api/grade-definition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetWord: word.word,
            officialDefinition: word.definition,
            userDefinition: definitionExplanation,
            partOfSpeech: word.part_of_speech,
            exampleSentence: word.example_sentence,
          }),
        });

        const data: GradeResponse = await res.json();
        setGradeFeedback(data);

        const earned = data.passed ? Math.max(10, Math.round(data.score / 5)) : 0;
        setPointsEarned(earned);

        if (data.passed) {
          playCorrectSound();
          setStatus("correct");
        } else {
          playWrongSound();
          setStatus("wrong");
        }

        pendingResultRef.current = {
          word,
          correct: data.passed,
          pointsEarned: earned,
          timeMs,
          accuracy: data.score,
        };
      } catch (err) {
        console.error("Failed to grade definition:", err);
        playCorrectSound();
        setStatus("correct");
        setPointsEarned(10);
        pendingResultRef.current = {
          word,
          correct: true,
          pointsEarned: 10,
          timeMs,
          accuracy: 80,
        };
      } finally {
        setIsGrading(false);
      }
      return;
    }

    // 2. Full Definition or Sentence Transcription Mode
    if (isSentenceMode) {
      const isExactMatch =
        textToEvaluate.trim().toLowerCase() === sentenceTarget.trim().toLowerCase();
      const accuracy = Math.max(
        0,
        Math.min(
          100,
          Math.round(((sentenceTarget.length - mistakeCount) / sentenceTarget.length) * 100),
        ),
      );
      const isPassed = isExactMatch || accuracy >= 85;

      const earned = isPassed ? 25 + Math.round(accuracy * 0.1) : 0;
      setPointsEarned(earned);

      if (isPassed) {
        playCorrectSound();
        setStatus("correct");
      } else {
        playWrongSound();
        setStatus("wrong");
      }

      pendingResultRef.current = {
        word,
        correct: isPassed,
        pointsEarned: earned,
        timeMs,
        accuracy,
      };
      return;
    }

    // 3. Standard Word Typing Modes
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

  const handleSkip = useCallback(() => {
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
  }, [status, word]);

  // Global Keyboard shortcuts:
  // - When answered: Enter or Space advances to next exercise
  // - When answering: Esc or Alt+S skips word, Alt+H reveals hint
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "idle") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
      } else {
        if (e.key === "Escape" || (e.altKey && (e.key === "s" || e.key === "S"))) {
          e.preventDefault();
          handleSkip();
        } else if (e.altKey && (e.key === "h" || e.key === "H")) {
          e.preventDefault();
          handleHint();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, handleNext, handleSkip, handleHint]);

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3">
          <Chip variant="mode" className="text-xs tracking-wider uppercase">
            {modeName}
          </Chip>
          {liveWpm !== undefined && liveWpm > 0 && (
            <span className="border-primary/40 bg-primary/10 text-primary animate-pulse rounded-full border px-3 py-0.5 text-xs font-black">
              âš¡ {liveWpm} WPM
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Kalding mood={mood} size={92} title={`Kalding is ${mood}`} />
          <SpeechBubble className="text-sm font-bold sm:text-base">
            {speechText}
          </SpeechBubble>
        </div>

        <PromptCard
          word={word}
          mode={mode}
          status={status}
          revealedLetters={revealedLetters}
          pointsEarned={pointsEarned}
        />

        {/* Input area rendered according to mode */}
        {mode === "word_to_def" ? (
          <div className="flex w-full flex-col gap-3">
            <textarea
              value={definitionExplanation}
              onChange={(e) => setDefinitionExplanation(e.target.value)}
              placeholder={`Describe in your own words what "${word.word}" means...`}
              rows={3}
              disabled={status !== "idle" || isGrading}
              className="border-border bg-card text-foreground focus:border-primary w-full resize-none rounded-2xl border-2 p-4 text-base font-medium transition-colors focus:outline-none"
            />

            {gradeFeedback && status !== "idle" && (
              <div
                className={`flex flex-col gap-2 rounded-2xl border-2 p-4 ${
                  gradeFeedback.passed
                    ? "border-success-border bg-success-bg/40 text-success-fg"
                    : "border-warning-border bg-warning-bg/40 text-warning-fg"
                }`}
              >
                <div className="flex items-center justify-between font-black text-sm">
                  <span>Score: {gradeFeedback.score}%</span>
                  <span className="text-xs font-bold uppercase">
                    Graded by {gradeFeedback.gradedBy === "ai" ? "AI Coach" : "Local Engine"}
                  </span>
                </div>
                <p className="text-xs font-semibold">{gradeFeedback.feedback}</p>
                {gradeFeedback.keyConceptsMatched.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="font-bold">Matched concepts:</span>
                    {gradeFeedback.keyConceptsMatched.map((c) => (
                      <span
                        key={c}
                        className="border-success-border/60 bg-success-bg rounded-md border px-2 py-0.5 text-[11px] font-extrabold"
                      >
                        âœ“ {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isSentenceMode ? (
          <SentenceTypingArea
            targetText={sentenceTarget}
            typedText={typedText}
            onChange={setTypedText}
            onSubmit={status === "idle" ? (val) => handleCheck(val) : handleNext}
            onMistake={handleMistake}
            disabled={status !== "idle"}
          />
        ) : (
          <TypingArea
            targetWord={word.word}
            typedText={typedText}
            onChange={setTypedText}
            onSubmit={status === "idle" ? handleCheck : handleNext}
            onMistake={handleMistake}
            disabled={status !== "idle"}
          />
        )}
      </main>

      <FeedbackBar
        status={status}
        canCheck={
          mode === "word_to_def"
            ? definitionExplanation.trim().length >= 4 && !isGrading
            : typedText.trim().length > 0
        }
        onCheck={handleCheck}
        onSkip={handleSkip}
        onHint={handleHint}
        onNext={handleNext}
        hintDisabled={
          mode === "word_to_def" ||
          status !== "idle" ||
          revealedLetters.length >= (isSentenceMode ? sentenceTarget.length : word.word.length)
        }
      />
    </>
  );
}

export function PracticeEngine({
  words,
  mode = "def_to_word",
  modeName,
  initialPoints = 0,
  initialStreak = 0,
  userId,
}: PracticeEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalTypedChars, setTotalTypedChars] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(1);

  // Timer interval for speed run mode (pure React state update)
  useEffect(() => {
    if (mode !== "speed_run") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const supabase = createClient();
  const currentWord = words[currentIndex];

  const handleFinishWord = useCallback(
    (res: SessionResult) => {
      setSessionPoints((prev) => prev + res.pointsEarned);
      setTotalTypedChars((prev) => prev + res.word.word.length);
      setResults((prev) => [...prev, res]);

      // Save attempt to Supabase and update SRS user_words progress
      if (userId) {
        recordWordAttempt({
          supabase,
          userId,
          wordId: res.word.id,
          mode,
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
    [currentIndex, words.length, userId, supabase, mode],
  );

  // Live WPM calculation for Speed Run
  const liveWpmResult = calculateWpm({
    charactersTyped: totalTypedChars,
    errors: results.filter((r) => !r.correct).length * 4,
    timeMs: Math.max(1000, elapsedSeconds * 1000),
  });

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
        mode={mode}
        modeName={modeName}
        streakDays={initialStreak}
        onFinishWord={handleFinishWord}
        liveWpm={mode === "speed_run" ? liveWpmResult.netWpm : undefined}
      />
    </div>
  );
}
