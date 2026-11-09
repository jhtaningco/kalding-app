"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordWordAttempt } from "@/lib/srs/recordAttempt";
import { playCorrectSound, playWrongSound, playLevelUpSound } from "@/lib/sounds";
import { speak } from "@/lib/tts";
import { DAILY_WORD_BONUS_XP, validateUserSentence, type SentenceValidationResult } from "@/core/dailyWord";
import type { Tables } from "@/types/database";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TypingArea } from "@/components/practice/TypingArea";
import { SentenceTypingArea } from "@/components/practice/SentenceTypingArea";
import { SpeakerIcon, CheckIcon, StarIcon, ArrowRightIcon } from "@/components/ui/icons";

export interface DailyWordEngineProps {
  word: Tables<"words">;
  dateKey: string;
  initialCompleted?: boolean;
  initialPoints?: number;
  initialStreak?: number;
  userId?: string;
}

type DailyStage = 1 | 2 | 3 | 4 | "complete";

export function DailyWordEngine({
  word,
  dateKey,
  initialCompleted = false,
  initialPoints = 0,
  initialStreak = 0,
  userId,
}: DailyWordEngineProps) {
  const supabase = createClient();

  const [stage, setStage] = useState<DailyStage>(initialCompleted ? "complete" : 1);
  const [totalEarned, setTotalEarned] = useState(initialCompleted ? DAILY_WORD_BONUS_XP : 0);
  const [, setIsCompleted] = useState(initialCompleted);

  // Stage 1: Word spelling
  const [typedWord, setTypedWord] = useState("");
  const [stage1Status, setStage1Status] = useState<"idle" | "correct" | "wrong">("idle");

  // Stage 2: Definition typing
  const [typedDef, setTypedDef] = useState("");
  const [stage2Status, setStage2Status] = useState<"idle" | "correct" | "wrong">("idle");

  // Stage 3: Sentence transcription
  const [typedSentence, setTypedSentence] = useState("");
  const [stage3Status, setStage3Status] = useState<"idle" | "correct" | "wrong">("idle");

  // Stage 4: Original sentence creation
  const [userSentence, setUserSentence] = useState("");
  const [validation, setValidation] = useState<SentenceValidationResult>({
    isValid: false,
    message: `Write an original sentence with at least 4 words using "${word.word}".`,
    hasTargetWord: false,
    hasPunctuation: false,
    wordCount: 0,
  });
  const [stage4Status, setStage4Status] = useState<"idle" | "correct" | "wrong">("idle");

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Handle live validation in Stage 4
  const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setUserSentence(val);
    setValidation(validateUserSentence(val, word.word));
  };

  // Stage 1: Check spelling
  const handleCheckStage1 = () => {
    if (stage1Status !== "idle") return;
    const isCorrect = typedWord.trim().toLowerCase() === word.word.trim().toLowerCase();
    if (isCorrect) {
      playCorrectSound();
      setStage1Status("correct");
      setTotalEarned((p) => p + 10);
    } else {
      playWrongSound();
      setStage1Status("wrong");
    }
  };

  // Stage 2: Check definition
  const handleCheckStage2 = (explicit?: string) => {
    if (stage2Status !== "idle") return;
    const text = typeof explicit === "string" ? explicit : typedDef;
    const isExact = text.trim().toLowerCase() === word.definition.trim().toLowerCase();
    const isClose = text.trim().length >= word.definition.trim().length * 0.85;

    if (isExact || isClose) {
      playCorrectSound();
      setStage2Status("correct");
      setTotalEarned((p) => p + 15);
    } else {
      playWrongSound();
      setStage2Status("wrong");
    }
  };

  // Stage 3: Check sentence transcription
  const handleCheckStage3 = (explicit?: string) => {
    if (stage3Status !== "idle") return;
    const target = word.example_sentence || word.definition;
    const text = typeof explicit === "string" ? explicit : typedSentence;
    const isClose = text.trim().length >= target.trim().length * 0.85;

    if (isClose) {
      playCorrectSound();
      setStage3Status("correct");
      setTotalEarned((p) => p + 15);
    } else {
      playWrongSound();
      setStage3Status("wrong");
    }
  };

  // Stage 4: Submit custom sentence and complete
  const handleCompleteDailyWord = useCallback(async () => {
    if (!validation.isValid || stage4Status !== "idle") return;

    playLevelUpSound();
    setStage4Status("correct");
    const bonus = DAILY_WORD_BONUS_XP;
    setTotalEarned((p) => p + bonus);
    setIsCompleted(true);
    setStage("complete");

    // Persist attempt to Supabase
    if (userId) {
      const timeMs = Math.max(1000, Date.now() - startTimeRef.current);
      await recordWordAttempt({
        supabase,
        userId,
        wordId: word.id,
        mode: "daily_word",
        correct: true,
        typedText: userSentence,
        timeMs,
        accuracy: 100,
        pointsEarned: bonus,
        language: word.language || "en",
      }).catch((err) => {
        console.warn("Failed to persist daily word attempt:", err);
      });
    }
  }, [validation.isValid, stage4Status, userId, word, userSentence, supabase]);

  // Keyboard navigation: Enter advances stages when ready
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (stage === 1 && stage1Status === "correct") {
          e.preventDefault();
          setStage(2);
        } else if (stage === 2 && stage2Status === "correct") {
          e.preventDefault();
          setStage(3);
        } else if (stage === 3 && stage3Status === "correct") {
          e.preventDefault();
          setStage(4);
        } else if (stage === 4 && validation.isValid && stage4Status === "idle") {
          e.preventDefault();
          handleCompleteDailyWord();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [stage, stage1Status, stage2Status, stage3Status, stage4Status, validation.isValid, handleCompleteDailyWord]);

  // Stage progress values
  const stageNum = stage === "complete" ? 4 : stage;

  // Mascot dynamic guidance
  let mood: KaldingMood = "thinking";
  let speech = `Focus on today's word: "${word.word}". Let's master it completely!`;

  if (stage === "complete") {
    mood = "celebrate";
    speech = `Magnificent job! You mastered today's word and earned +${DAILY_WORD_BONUS_XP} XP!`;
  } else if (stage === 1) {
    mood = stage1Status === "correct" ? "happy" : "thinking";
    speech =
      stage1Status === "correct"
        ? `Spot on! Press Continue or hit Enter to type the definition.`
        : `Part 1: Recall & Spelling. Listen and type the target word!`;
  } else if (stage === 2) {
    mood = stage2Status === "correct" ? "happy" : "neutral";
    speech =
      stage2Status === "correct"
        ? `Great definition typing! Let's transcribe the example sentence next.`
        : `Part 2: Type the complete dictionary definition character-by-character.`;
  } else if (stage === 3) {
    mood = stage3Status === "correct" ? "happy" : "neutral";
    speech =
      stage3Status === "correct"
        ? `Sentence transcribed! Finally, write your own sentence with "${word.word}".`
        : `Part 3: Transcribe the authentic example sentence with punctuation.`;
  } else if (stage === 4) {
    mood = validation.isValid ? "happy" : "thinking";
    speech = validation.isValid
      ? `Your sentence looks great! Click Complete Challenge to claim your +50 XP bonus.`
      : `Part 4: Use "${word.word}" in an original sentence of your own.`;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        points={initialPoints + totalEarned}
        streak={initialStreak}
        progress={{ value: stageNum, max: 4 }}
        exitHref="/"
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:py-8">
        {/* Stage Pills & Date Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Chip variant="mode" className="text-xs font-black uppercase tracking-wider">
            ðŸŒŸ Vocabulary of the Day
          </Chip>
          <span className="border-border bg-card text-muted rounded-full border px-3 py-0.5 text-xs font-extrabold">
            {dateKey}
          </span>
          <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-xs font-black">
            +{DAILY_WORD_BONUS_XP} XP Bonus
          </span>
        </div>

        {/* Mascot Header */}
        <div className="flex items-center gap-3">
          <Kalding mood={mood} size={92} title={`Kalding is ${mood}`} />
          <SpeechBubble className="text-sm font-bold sm:text-base">
            {speech}
          </SpeechBubble>
        </div>

        {/* ================= STAGE 1: SPELLING & RECALL ================= */}
        {stage === 1 && (
          <div className="flex w-full flex-col gap-4 animate-fade-in">
            <Card className="flex flex-col gap-3 p-6 text-left sm:p-8">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Chip variant="neutral" className="text-xs font-bold uppercase">
                    {word.part_of_speech}
                  </Chip>
                  {word.level && (
                    <span className="border-border bg-background text-muted rounded-md border px-2 py-0.5 text-xs font-bold capitalize">
                      {word.level}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => speak(word.word)}
                  title="Pronounce word"
                  className="border-border bg-card text-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-xl border-2 transition-colors"
                >
                  <SpeakerIcon size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted text-xs font-extrabold uppercase tracking-wider">
                  Target Definition
                </span>
                <p className="text-foreground text-xl font-bold sm:text-2xl">
                  {word.definition}
                </p>
              </div>
            </Card>

            <TypingArea
              targetWord={word.word}
              typedText={typedWord}
              onChange={setTypedWord}
              onSubmit={stage1Status === "idle" ? handleCheckStage1 : () => setStage(2)}
              disabled={stage1Status !== "idle"}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-muted text-xs font-bold">Step 1 of 4: Spelling</span>
              {stage1Status === "correct" ? (
                <Button size="lg" onClick={() => setStage(2)} className="animate-pop">
                  <span>Continue to Definition</span>
                  <ArrowRightIcon size={18} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={typedWord.trim().length === 0}
                  onClick={handleCheckStage1}
                >
                  Check Word
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ================= STAGE 2: DEFINITION TYPING ================= */}
        {stage === 2 && (
          <div className="flex w-full flex-col gap-4 animate-fade-in">
            <Card className="flex flex-col gap-2 p-6 text-left sm:p-8">
              <span className="text-muted text-xs font-extrabold uppercase tracking-wider">
                Type the Full Definition
              </span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-primary text-3xl font-black sm:text-4xl">
                  {word.word}
                </h2>
                <span className="text-muted text-sm font-bold italic">
                  ({word.part_of_speech})
                </span>
              </div>
            </Card>

            <SentenceTypingArea
              targetText={word.definition}
              typedText={typedDef}
              onChange={setTypedDef}
              onSubmit={stage2Status === "idle" ? (val) => handleCheckStage2(val) : () => setStage(3)}
              disabled={stage2Status !== "idle"}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-muted text-xs font-bold">Step 2 of 4: Definition</span>
              {stage2Status === "correct" ? (
                <Button size="lg" onClick={() => setStage(3)} className="animate-pop">
                  <span>Continue to Sentence</span>
                  <ArrowRightIcon size={18} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={typedDef.trim().length < 5}
                  onClick={() => handleCheckStage2()}
                >
                  Check Definition
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ================= STAGE 3: EXAMPLE SENTENCE TRANSCRIPTION ================= */}
        {stage === 3 && (
          <div className="flex w-full flex-col gap-4 animate-fade-in">
            <Card className="flex flex-col gap-2 p-6 text-left sm:p-8">
              <span className="text-muted text-xs font-extrabold uppercase tracking-wider">
                Transcribe Example Sentence
              </span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-primary text-2xl font-black sm:text-3xl">
                  Target: {word.word}
                </h2>
              </div>
            </Card>

            <SentenceTypingArea
              targetText={word.example_sentence || word.definition}
              typedText={typedSentence}
              onChange={setTypedSentence}
              onSubmit={stage3Status === "idle" ? (val) => handleCheckStage3(val) : () => setStage(4)}
              disabled={stage3Status !== "idle"}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-muted text-xs font-bold">Step 3 of 4: Example Sentence</span>
              {stage3Status === "correct" ? (
                <Button size="lg" onClick={() => setStage(4)} className="animate-pop">
                  <span>Create Your Own Sentence</span>
                  <ArrowRightIcon size={18} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={typedSentence.trim().length < 5}
                  onClick={() => handleCheckStage3()}
                >
                  Check Transcription
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ================= STAGE 4: ORIGINAL SENTENCE COMPOSITION ================= */}
        {stage === 4 && (
          <div className="flex w-full flex-col gap-4 animate-fade-in">
            <Card className="flex flex-col gap-3 p-6 text-left sm:p-8">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted text-xs font-extrabold uppercase tracking-wider">
                  Step 4 of 4: Original Sentence
                </span>
                <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-xs font-extrabold">
                  Target: &ldquo;{word.word}&rdquo;
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-xl font-black sm:text-2xl">
                  Write Your Own Sentence
                </h2>
                <p className="text-muted text-xs leading-relaxed">
                  Compose an authentic sentence using <strong>&ldquo;{word.word}&rdquo;</strong> in real context.
                </p>
              </div>

              <textarea
                value={userSentence}
                onChange={handleSentenceChange}
                placeholder={`Example: I noticed an ${word.word} supply of fresh ideas at the meeting.`}
                rows={3}
                disabled={stage4Status !== "idle"}
                className="border-border bg-card text-foreground focus:border-primary w-full resize-none rounded-2xl border-2 p-4 text-base font-medium transition-colors focus:outline-none"
              />

              {/* Live Sentence Checklist */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-extrabold transition-colors ${
                    validation.hasTargetWord
                      ? "border-success-border bg-success-bg text-success-fg"
                      : "border-border bg-card text-muted"
                  }`}
                >
                  {validation.hasTargetWord ? "âœ“" : "â—‹"} Uses &ldquo;{word.word}&rdquo;
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-extrabold transition-colors ${
                    validation.wordCount >= 4
                      ? "border-success-border bg-success-bg text-success-fg"
                      : "border-border bg-card text-muted"
                  }`}
                >
                  {validation.wordCount >= 4 ? "âœ“" : "â—‹"} At least 4 words ({validation.wordCount}/4)
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-extrabold transition-colors ${
                    validation.hasPunctuation
                      ? "border-success-border bg-success-bg text-success-fg"
                      : "border-border bg-card text-muted"
                  }`}
                >
                  {validation.hasPunctuation ? "âœ“" : "â—‹"} Ends with punctuation (. ! ?)
                </span>
              </div>
            </Card>

            <Button
              size="lg"
              disabled={!validation.isValid || stage4Status !== "idle"}
              onClick={handleCompleteDailyWord}
              className="w-full text-base"
            >
              <StarIcon size={20} />
              <span>Complete Daily Challenge (+{DAILY_WORD_BONUS_XP} XP)</span>
            </Button>
          </div>
        )}

        {/* ================= STAGE COMPLETE: VICTORY & SUMMARY ================= */}
        {stage === "complete" && (
          <Card className="flex w-full flex-col items-center gap-6 p-6 text-center shadow-xl sm:p-10 animate-pop">
            <div className="border-primary/50 bg-primary/10 text-primary flex items-center gap-2 rounded-full border-2 px-4 py-1 text-xs font-black uppercase tracking-wider">
              <StarIcon size={16} /> Vocabulary of the Day Mastered!
            </div>

            <div className="flex flex-col items-center gap-1">
              <h1 className="text-foreground text-3xl font-black sm:text-4xl">
                {word.word}
              </h1>
              <span className="text-muted text-sm font-semibold italic">
                ({word.part_of_speech})
              </span>
              <p className="text-muted max-w-md pt-2 text-sm font-medium">
                {word.definition}
              </p>
            </div>

            {/* Bonus Points Badge */}
            <div className="flex items-center gap-6 rounded-2xl border-2 border-border/80 bg-background/60 p-4">
              <div className="flex flex-col items-center">
                <span className="text-muted text-[11px] font-extrabold uppercase">Bonus Earned</span>
                <span className="text-primary text-2xl font-black">+{DAILY_WORD_BONUS_XP} XP</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-muted text-[11px] font-extrabold uppercase">Daily Status</span>
                <span className="text-success-fg flex items-center gap-1 text-base font-black">
                  <CheckIcon size={18} /> Completed
                </span>
              </div>
            </div>

            {userSentence && (
              <div className="border-border/60 bg-card/60 flex w-full flex-col gap-1 rounded-2xl border p-4 text-left">
                <span className="text-muted text-[11px] font-extrabold uppercase">
                  Your Original Sentence:
                </span>
                <p className="text-foreground text-sm font-bold italic">
                  &ldquo;{userSentence}&rdquo;
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <ButtonLink href="/" size="lg" className="min-w-[180px]">
                Home Dashboard
              </ButtonLink>
              <ButtonLink href="/practice" variant="secondary" size="lg" className="min-w-[180px]">
                Practice Arena
              </ButtonLink>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
