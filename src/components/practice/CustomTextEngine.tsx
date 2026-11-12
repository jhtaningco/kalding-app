"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCustomTextAttempt } from "@/lib/srs/recordAttempt";
import { playWrongSound, playLevelUpSound } from "@/lib/sounds";
import { speak } from "@/lib/tts";
import { calculateWpm } from "@/core/wpm";
import {
  PRESET_CUSTOM_TEXTS,
  normalizeCustomText,
  getCustomTextStats,
  calculateCustomTextScore,
  type CustomTextPreset,
  type CustomTextScoreResult,
} from "@/core/customTyping";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SentenceTypingArea } from "@/components/practice/SentenceTypingArea";
import {
  SpeakerIcon,
  FlameIcon,
  StarIcon,
  RefreshIcon,
  ClipboardIcon,
} from "@/components/ui/icons";

export interface CustomTextEngineProps {
  initialPoints?: number;
  initialStreak?: number;
  userId?: string;
}

type ModeStep = "setup" | "typing" | "summary";

export function CustomTextEngine({
  initialPoints = 0,
  initialStreak = 0,
  userId,
}: CustomTextEngineProps) {
  const supabase = createClient();

  const [step, setStep] = useState<ModeStep>("setup");
  const [inputText, setInputText] = useState("");
  const [activeTitle, setActiveTitle] = useState("Custom Paragraph");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [autoClean, setAutoClean] = useState(true);

  // Live typing state
  const [targetText, setTargetText] = useState("");
  const [typedText, setTypedText] = useState("");
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);

  // Gamification state
  const [currentPoints, setCurrentPoints] = useState(initialPoints);
  const [currentStreak, setCurrentStreak] = useState(initialStreak);
  const [scoreResult, setScoreResult] = useState<CustomTextScoreResult | null>(null);
  const [finalWpm, setFinalWpm] = useState<{ netWpm: number; grossWpm: number; accuracy: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Live stats during typing
  const [liveWpm, setLiveWpm] = useState(0);
  const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Text stats for setup screen
  const textStats = getCustomTextStats(inputText);
  const hasEnoughWords = textStats.wordCount >= 3;

  // Handle Preset Selection
  const handleSelectPreset = (preset: CustomTextPreset) => {
    setSelectedPresetId(preset.id);
    setActiveTitle(preset.title);
    setInputText(preset.text);
  };

  // Start Typing
  const handleStartTyping = () => {
    if (!hasEnoughWords) return;

    const preparedText = autoClean ? normalizeCustomText(inputText) : inputText.trim();
    setTargetText(preparedText);
    setTypedText("");
    setMistakeCount(0);
    startTimeRef.current = null;
    setElapsedSeconds(0);
    setLiveWpm(0);
    setScoreResult(null);
    setFinalWpm(null);
    setStep("typing");
  };

  // Handle Mistake
  const handleMistake = useCallback(() => {
    setMistakeCount((prev) => prev + 1);
    playWrongSound();
  }, []);

  // Complete Run
  const handleComplete = useCallback(
    async (completedTypedText: string) => {
      const now = Date.now();
      if (wpmIntervalRef.current) {
        clearInterval(wpmIntervalRef.current);
      }

      const elapsedMs = startTimeRef.current
        ? Math.max(1000, now - startTimeRef.current)
        : 1000;
      const finalSec = Math.max(1, Math.round(elapsedMs / 1000));
      setElapsedSeconds(finalSec);

      const metrics = calculateWpm({
        charactersTyped: completedTypedText.length,
        errors: mistakeCount,
        timeMs: elapsedMs,
      });
      setFinalWpm({
        netWpm: metrics.netWpm,
        grossWpm: metrics.grossWpm,
        accuracy: metrics.accuracy,
      });

      const words = targetText.split(/\s+/).filter(Boolean).length;
      const score = calculateCustomTextScore({
        wordCount: words,
        accuracy: metrics.accuracy,
        netWpm: metrics.netWpm,
        streakDays: currentStreak,
      });
      setScoreResult(score);

      playLevelUpSound();
      setStep("summary");

      // Save to database & update gamification if user is logged in
      if (userId) {
        setIsSaving(true);
        try {
          await recordCustomTextAttempt({
            supabase,
            userId,
            pointsEarned: score.totalPoints,
            wordCount: words,
            accuracy: metrics.accuracy,
            timeMs: elapsedMs,
            typedText: completedTypedText,
          });

          const newPoints = currentPoints + score.totalPoints;
          setCurrentPoints(newPoints);
          if (currentStreak === 0) {
            setCurrentStreak(1);
          }

          // Notify AppHeader and other components
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("kalding-points-update", {
                detail: { points: newPoints },
              }),
            );
          }
        } catch (err) {
          console.error("Failed to record custom text attempt:", err);
        } finally {
          setIsSaving(false);
        }
      }
    },
    [currentPoints, currentStreak, mistakeCount, supabase, targetText, userId],
  );

  // Handle Live Typing Change
  const handleTypingChange = (value: string) => {
    // Record start time on first keystroke without causing re-render
    if (startTimeRef.current === null && value.length > 0) {
      startTimeRef.current = Date.now();
    }

    setTypedText(value);

    // If completed typing the whole paragraph
    if (value.length >= targetText.length && targetText.length > 0) {
      handleComplete(value);
    }
  };

  // Calculate live WPM interval
  useEffect(() => {
    if (step === "typing") {
      wpmIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsedMs = Date.now() - startTimeRef.current;
          setElapsedSeconds(Math.max(1, Math.round(elapsedMs / 1000)));
          const metrics = calculateWpm({
            charactersTyped: typedText.length,
            errors: mistakeCount,
            timeMs: elapsedMs,
          });
          setLiveWpm(metrics.netWpm);
        }
      }, 500);
    }

    return () => {
      if (wpmIntervalRef.current) {
        clearInterval(wpmIntervalRef.current);
      }
    };
  }, [step, typedText.length, mistakeCount]);

  // Listen / TTS Audio
  const handleSpeakText = () => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const textToRead = step === "setup" ? inputText : targetText;
    if (!textToRead) return;

    setIsSpeaking(true);
    speak(textToRead, { rate: 0.92 });

    // Reset speaking state when finished
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkInterval);
        }
      }, 500);
    }
  };

  // Restart Current Text
  const handleRestart = () => {
    setTypedText("");
    setMistakeCount(0);
    startTimeRef.current = null;
    setElapsedSeconds(0);
    setLiveWpm(0);
    setScoreResult(null);
    setFinalWpm(null);
    setStep("typing");
  };

  // Dynamic Kalding Mood & Feedback
  let kaldingMood: KaldingMood = "happy";
  let kaldingSpeech = "Paste your text below or pick one of the sample excerpts to start typing!";

  if (step === "typing") {
    if (liveWpm >= 60) {
      kaldingMood = "celebrate";
      kaldingSpeech = `Blazing fast! ${liveWpm} WPM! Keep those fingers dancing!`;
    } else if (liveWpm >= 35) {
      kaldingMood = "happy";
      kaldingSpeech = `Smooth rhythm! Steady at ${liveWpm} WPM.`;
    } else if (mistakeCount > 3) {
      kaldingMood = "thinking";
      kaldingSpeech = "Take a breath and find your cadence. Accuracy builds real speed!";
    } else {
      kaldingMood = "happy";
      kaldingSpeech = "Transcribe the paragraph character-by-character. You got this!";
    }
  } else if (step === "summary") {
    kaldingMood = "celebrate";
    kaldingSpeech = `Magnificent work! You transcribed ${textStats.wordCount} words and earned ${scoreResult?.totalPoints ?? 0} XP!`;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background text-foreground">
      {/* TopBar during active typing or summary */}
      {step !== "setup" ? (
        <TopBar
          exitHref="/practice"
          progress={{
            value: Math.min(typedText.length, targetText.length),
            max: Math.max(1, targetText.length),
          }}
          streak={currentStreak}
          points={currentPoints}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <ButtonLink href="/practice" variant="ghost" size="sm">
            ← Back to Practice Hub
          </ButtonLink>
          <div className="flex items-center gap-3">
            <span className="border-border/80 bg-card text-muted flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
              <FlameIcon size={14} className="text-accent" />
              {currentStreak} Day Streak
            </span>
            <span className="border-border/80 bg-card text-muted flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
              <StarIcon size={14} className="text-primary" />
              {currentPoints} XP
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6">
        {/* Mascot & Speech */}
        <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Kalding mood={kaldingMood} size={90} title="Kalding Mascot" />
          <SpeechBubble tail="left" className="text-base sm:text-lg">
            {kaldingSpeech}
          </SpeechBubble>
        </div>

        {/* STEP 1: SETUP SCREEN */}
        {step === "setup" && (
          <div className="flex w-full flex-col gap-6">
            <Card className="flex flex-col gap-5 p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="border-primary/40 bg-primary/10 text-primary flex size-8 items-center justify-center rounded-xl border">
                      <ClipboardIcon size={18} />
                    </div>
                    <h1 className="text-foreground text-xl font-black sm:text-2xl">
                      Paste & Type
                    </h1>
                  </div>
                  <Chip variant="mode" className="text-xs uppercase font-bold">
                    Custom Paragraph
                  </Chip>
                </div>
                <p className="text-muted text-sm leading-relaxed">
                  Paste any English article, essay, or speech to train your typing muscle memory on your own materials.
                  {activeTitle !== "Custom Paragraph" && (
                    <span className="text-primary font-bold ml-1">
                      (Selected: {activeTitle})
                    </span>
                  )}
                </p>
              </div>

              {/* Preset Sample Pills */}
              <div className="flex flex-col gap-2">
                <span className="text-muted text-xs font-black uppercase tracking-wider">
                  Or pick a curated sample excerpt:
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                  {PRESET_CUSTOM_TEXTS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`flex flex-col gap-1 rounded-2xl border-2 p-3 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/80 bg-background/60 hover:border-primary/60 hover:bg-card"
                        }`}
                      >
                        <span className="text-foreground text-xs font-black line-clamp-1">
                          {preset.title}
                        </span>
                        <span className="text-muted text-[10px] font-bold line-clamp-1">
                          {preset.source}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="custom-text-input" className="sr-only">
                  Paste English text here
                </label>
                <textarea
                  id="custom-text-input"
                  rows={6}
                  value={inputText}
                  onChange={(e) => {
                    setSelectedPresetId(null);
                    setActiveTitle("Custom Paragraph");
                    setInputText(e.target.value);
                  }}
                  placeholder="Paste your English paragraph, article excerpt, or speech here..."
                  className="border-border focus:border-primary/80 focus:ring-primary/20 w-full rounded-2xl border-2 bg-background p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-4 transition-all"
                />

                {/* Stats Bar & Options */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-muted">
                  <div className="flex items-center gap-4">
                    <span>{textStats.wordCount} words</span>
                    <span>•</span>
                    <span>{textStats.charCount} characters</span>
                    {textStats.wordCount > 0 && (
                      <>
                        <span>•</span>
                        <span>~{textStats.estimatedSeconds}s typing time</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={autoClean}
                        onChange={(e) => setAutoClean(e.target.checked)}
                        className="accent-primary size-4 rounded"
                      />
                      <span>Auto-clean quotes & format paragraphs</span>
                    </label>

                    {inputText && (
                      <button
                        type="button"
                        onClick={handleSpeakText}
                        className="border-border bg-card hover:bg-card-hover flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold text-foreground transition-colors"
                        title="Listen to text"
                      >
                        <SpeakerIcon size={14} className={isSpeaking ? "text-primary animate-pulse" : ""} />
                        <span>{isSpeaking ? "Speaking..." : "Listen"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {inputText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setInputText("");
                      setSelectedPresetId(null);
                      setActiveTitle("Custom Paragraph");
                    }}
                  >
                    Clear Text
                  </Button>
                )}
                <Button
                  type="button"
                  size="lg"
                  disabled={!hasEnoughWords}
                  onClick={handleStartTyping}
                  className="w-full sm:w-auto"
                >
                  Start Typing {textStats.wordCount > 0 ? `(${textStats.wordCount} words)` : ""}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: ACTIVE TYPING ARENA */}
        {step === "typing" && (
          <div className="flex w-full flex-col gap-6">
            {/* Live Metrics Header Card */}
            <div className="border-border bg-card flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 px-6 py-4 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-muted text-[10px] font-black uppercase tracking-wider">
                    Speed
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-foreground text-2xl font-black">{liveWpm}</span>
                    <span className="text-muted text-xs font-bold">WPM</span>
                  </div>
                </div>

                <div className="border-border h-8 w-[1px] border-r" />

                <div className="flex flex-col">
                  <span className="text-muted text-[10px] font-black uppercase tracking-wider">
                    Mistakes
                  </span>
                  <span className="text-foreground text-2xl font-black">
                    {mistakeCount}
                  </span>
                </div>

                <div className="border-border h-8 w-[1px] border-r" />

                <div className="flex flex-col">
                  <span className="text-muted text-[10px] font-black uppercase tracking-wider">
                    Progress
                  </span>
                  <span className="text-foreground text-2xl font-black">
                    {Math.round(
                      (Math.min(typedText.length, targetText.length) /
                        Math.max(1, targetText.length)) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeakText}
                  title="Listen to text"
                  className="flex items-center gap-1.5"
                >
                  <SpeakerIcon size={16} className={isSpeaking ? "text-primary animate-pulse" : ""} />
                  <span>{isSpeaking ? "Pause" : "Listen"}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  title="Restart test"
                >
                  <RefreshIcon size={16} />
                </Button>
              </div>
            </div>

            {/* Transcription Typing Area */}
            <SentenceTypingArea
              targetText={targetText}
              typedText={typedText}
              onChange={handleTypingChange}
              onMistake={handleMistake}
            />

            {/* Quick helper footer */}
            <div className="flex items-center justify-between text-xs font-bold text-muted px-2">
              <span>Tip: Spacebar moves to the next word. Enter or Space advances to the next paragraph.</span>
              <button
                type="button"
                onClick={() => setStep("setup")}
                className="hover:text-foreground underline underline-offset-4"
              >
                Change Text
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY SCREEN */}
        {step === "summary" && scoreResult && finalWpm && (
          <div className="flex w-full flex-col gap-6">
            <Card className="flex flex-col items-center gap-6 p-6 text-center sm:p-10">
              <div className="flex flex-col items-center gap-2">
                <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-3 py-0.5 text-xs font-black uppercase tracking-wider">
                  Transcription Complete
                </span>
                <h2 className="text-foreground text-2xl font-black sm:text-3xl">
                  Splendid Typing Session!
                </h2>
                <p className="text-muted text-sm max-w-md">
                  You successfully transcribed <strong className="text-foreground">{textStats.wordCount} words</strong> with high precision and speed.
                </p>
              </div>

              {/* Stats Highlights Grid */}
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="border-border/80 bg-background/80 flex flex-col items-center justify-center rounded-2xl border p-4">
                  <span className="text-muted text-xs font-black uppercase">Net Speed</span>
                  <span className="text-primary text-3xl font-black mt-1">
                    {finalWpm.netWpm}
                  </span>
                  <span className="text-muted text-[10px] font-bold">WPM</span>
                </div>

                <div className="border-border/80 bg-background/80 flex flex-col items-center justify-center rounded-2xl border p-4">
                  <span className="text-muted text-xs font-black uppercase">Accuracy</span>
                  <span className="text-foreground text-3xl font-black mt-1">
                    {finalWpm.accuracy}%
                  </span>
                  <span className="text-muted text-[10px] font-bold">
                    {mistakeCount} {mistakeCount === 1 ? "error" : "errors"}
                  </span>
                </div>

                <div className="border-border/80 bg-background/80 flex flex-col items-center justify-center rounded-2xl border p-4">
                  <span className="text-muted text-xs font-black uppercase">Time</span>
                  <span className="text-foreground text-3xl font-black mt-1">
                    {elapsedSeconds}s
                  </span>
                  <span className="text-muted text-[10px] font-bold">elapsed</span>
                </div>

                <div className="border-primary/60 bg-primary/10 flex flex-col items-center justify-center rounded-2xl border p-4 shadow-sm">
                  <span className="text-primary text-xs font-black uppercase">XP Earned</span>
                  <span className="text-primary text-3xl font-black mt-1">
                    +{scoreResult.totalPoints}
                  </span>
                  <span className="text-primary/80 text-[10px] font-bold">
                    {scoreResult.streakMultiplier > 1 ? `${scoreResult.streakMultiplier}x Boost` : "Points"}
                  </span>
                </div>
              </div>

              {/* XP Breakdown Card */}
              <div className="border-border bg-card w-full rounded-2xl border p-4 text-left">
                <span className="text-muted text-xs font-black uppercase tracking-wider block mb-2">
                  XP Rewards Breakdown
                </span>
                <div className="flex flex-col gap-1.5 text-xs font-bold text-muted">
                  <div className="flex justify-between">
                    <span>Base XP ({textStats.wordCount} words):</span>
                    <span className="text-foreground">+{scoreResult.basePoints} XP</span>
                  </div>
                  {scoreResult.accuracyBonus > 0 && (
                    <div className="flex justify-between">
                      <span>High Accuracy Bonus ({finalWpm.accuracy}%):</span>
                      <span className="text-success-fg">+{scoreResult.accuracyBonus} XP</span>
                    </div>
                  )}
                  {scoreResult.speedBonus > 0 && (
                    <div className="flex justify-between">
                      <span>Speed Demon Bonus ({finalWpm.netWpm} WPM):</span>
                      <span className="text-accent">+{scoreResult.speedBonus} XP</span>
                    </div>
                  )}
                  {scoreResult.streakMultiplier > 1 && (
                    <div className="flex justify-between border-t border-border pt-1">
                      <span>Streak Multiplier:</span>
                      <span className="text-primary">{scoreResult.streakMultiplier}x</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Message */}
              {isSaving && (
                <span className="text-muted text-xs animate-pulse font-bold">
                  Saving your score and protecting your streak...
                </span>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleRestart}
                  className="flex-1 sm:flex-initial"
                >
                  Type Again
                </Button>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    setStep("setup");
                    setInputText("");
                    setSelectedPresetId(null);
                    setActiveTitle("Custom Paragraph");
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  Paste New Text
                </Button>

                <ButtonLink
                  href="/practice"
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Practice Hub
                </ButtonLink>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
