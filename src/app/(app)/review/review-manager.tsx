"use client";

import { useMemo, useState } from "react";
import type { Tables } from "@/types/database";
import { getMasteryStage, isDueForReview, type MasteryStage } from "@/core/srs";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  ClockIcon,
  FlameIcon,
  CheckIcon,
  SpeakerIcon,
  RefreshIcon,
  BookOpenIcon,
} from "@/components/ui/icons";
import { speak } from "@/lib/tts";
import { PracticeEngine } from "../practice/[mode]/practice-engine";

export interface TrackedWordItem {
  word: Tables<"words">;
  srs: Tables<"user_words">;
}

interface ReviewManagerProps {
  trackedWords: TrackedWordItem[];
  fallbackWords: Tables<"words">[];
  initialPoints?: number;
  initialStreak?: number;
  userId?: string;
}

function formatRelativeReview(dateStr: string | null | undefined): string {
  if (!dateStr) return "Due now";
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) return "Due now";

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `In ${diffHours}h`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `In ${diffDays}d`;
}

export function ReviewManager({
  trackedWords: initialTrackedWords,
  fallbackWords,
  initialPoints = 0,
  initialStreak = 0,
  userId,
}: ReviewManagerProps) {
  const [trackedWords] = useState<TrackedWordItem[]>(initialTrackedWords);
  const [filter, setFilter] = useState<"all" | MasteryStage | "due">("all");
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewMode, setReviewMode] = useState<"due" | "all">("due");

  // Segregate words by SRS stages
  const { dueWords, learningWords, reviewingWords, masteredWords } = useMemo(() => {
    const due: TrackedWordItem[] = [];
    const learning: TrackedWordItem[] = [];
    const reviewing: TrackedWordItem[] = [];
    const mastered: TrackedWordItem[] = [];

    const now = new Date();
    for (const item of trackedWords) {
      if (isDueForReview(item.srs.next_review_at, now)) {
        due.push(item);
      }
      const stage = getMasteryStage(item.srs.interval_days, item.srs.times_seen);
      if (stage === "learning") learning.push(item);
      else if (stage === "reviewing") reviewing.push(item);
      else if (stage === "mastered") mastered.push(item);
    }

    return {
      dueWords: due,
      learningWords: learning,
      reviewingWords: reviewing,
      masteredWords: mastered,
    };
  }, [trackedWords]);

  const totalTracked = trackedWords.length;
  const masteredPercentage =
    totalTracked > 0 ? Math.round((masteredWords.length / totalTracked) * 100) : 0;

  // Filtered list for display
  const displayedWords = useMemo(() => {
    if (filter === "due") return dueWords;
    if (filter === "learning") return learningWords;
    if (filter === "reviewing") return reviewingWords;
    if (filter === "mastered") return masteredWords;
    return trackedWords;
  }, [filter, dueWords, learningWords, reviewingWords, masteredWords, trackedWords]);

  // Mascot mood and speech
  let mood: KaldingMood = "thinking";
  let speechText = "";

  if (dueWords.length > 0) {
    mood = "thinking";
    speechText = `You have ${dueWords.length} word${dueWords.length === 1 ? "" : "s"} ready for review! Keep your memory fresh.`;
  } else if (totalTracked > 0) {
    mood = "celebrate";
    speechText = "All caught up! You have reviewed all scheduled words for now.";
  } else {
    mood = "happy";
    speechText =
      "Welcome to your Spaced Repetition queue! Practice words to start tracking retention.";
  }

  // Active Review Session Mode
  if (isReviewing) {
    const sessionWords =
      reviewMode === "due" && dueWords.length > 0
        ? dueWords.map((item) => item.word)
        : trackedWords.length > 0
          ? trackedWords.map((item) => item.word)
          : fallbackWords.slice(0, 10);

    return (
      <div className="flex min-h-screen flex-col">
        <PracticeEngine
          words={sessionWords}
          modeName={reviewMode === "due" ? "SRS Scheduled Review" : "Early Refresh Review"}
          initialPoints={initialPoints}
          initialStreak={initialStreak}
          userId={userId}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      {/* Page Title & Mascot */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Kalding mood={mood} size={110} title={`Kalding is ${mood}`} />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Chip variant="mode" className="text-xs tracking-wider uppercase">
              Spaced Repetition System (SM-2)
            </Chip>
            {dueWords.length > 0 && (
              <span className="border-primary/40 bg-primary/10 text-primary animate-pulse rounded-full border px-2.5 py-0.5 text-xs font-black">
                {dueWords.length} DUE
              </span>
            )}
          </div>
          <SpeechBubble tail="left" className="text-base sm:text-lg">
            {speechText}
          </SpeechBubble>
        </div>
      </div>

      {/* Review Call to Action Card */}
      <Card className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
        {dueWords.length > 0 ? (
          <>
            <div className="flex flex-col items-center gap-1">
              <span className="text-muted text-xs font-extrabold tracking-wider uppercase">
                SRS Memory Reinforcement
              </span>
              <h2 className="text-foreground text-2xl font-black sm:text-3xl">
                {dueWords.length} Word{dueWords.length === 1 ? "" : "s"} Scheduled For Today
              </h2>
              <p className="text-muted max-w-md text-sm">
                Recalling words just as they begin to fade is what locks them into long-term
                memory.
              </p>
            </div>
            <Button
              onClick={() => {
                setReviewMode("due");
                setIsReviewing(true);
              }}
              size="lg"
              className="min-w-[260px] text-lg"
            >
              Start Review Session ({dueWords.length})
            </Button>
          </>
        ) : totalTracked > 0 ? (
          <>
            <div className="flex flex-col items-center gap-1">
              <span className="text-muted text-xs font-extrabold tracking-wider uppercase">
                Zero Reviews Pending
              </span>
              <h2 className="text-foreground text-2xl font-black sm:text-3xl">
                Your Memory Queue Is Up To Date!
              </h2>
              <p className="text-muted max-w-md text-sm">
                You have no reviews due right now. You can learn new words or review early
                to practice typing speed.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <ButtonLink href="/practice/def_to_word" size="lg" className="min-w-[200px]">
                Learn New Words
              </ButtonLink>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setReviewMode("all");
                  setIsReviewing(true);
                }}
              >
                Review Early ({totalTracked})
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1">
              <span className="text-muted text-xs font-extrabold tracking-wider uppercase">
                No Tracked Words Yet
              </span>
              <h2 className="text-foreground text-2xl font-black sm:text-3xl">
                Begin Your Vocabulary Journey
              </h2>
              <p className="text-muted max-w-md text-sm">
                Complete a 10-word typing session to start tracking word mastery and spaced
                repetition schedules.
              </p>
            </div>
            <ButtonLink
              href="/practice/def_to_word"
              size="lg"
              className="min-w-[240px] text-lg"
            >
              Start 10-Word Session
            </ButtonLink>
          </>
        )}
      </Card>

      {/* SRS Mastery Breakdown Card */}
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenIcon size={20} className="text-primary" />
            <h3 className="text-foreground text-base font-black sm:text-lg">
              Mastery Breakdown
            </h3>
          </div>
          <span className="text-muted text-xs font-bold">
            {masteredWords.length} of {totalTracked} mastered ({masteredPercentage}%)
          </span>
        </div>

        <ProgressBar
          value={masteredWords.length}
          max={Math.max(1, totalTracked)}
          label="Mastered vocabulary progress"
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
          {/* Learning Stage */}
          <div
            onClick={() => setFilter(filter === "learning" ? "all" : "learning")}
            className={`cursor-pointer rounded-2xl border-2 p-3 text-center transition-all ${
              filter === "learning"
                ? "border-warning-border bg-warning-bg/40 scale-[1.02]"
                : "border-border/80 hover:border-warning-border/60 bg-card"
            }`}
          >
            <span className="text-muted text-[11px] font-extrabold tracking-wider uppercase">
              Learning
            </span>
            <div className="text-foreground text-xl font-black sm:text-2xl">
              {learningWords.length}
            </div>
            <span className="text-muted text-[10px] font-bold">0-day interval</span>
          </div>

          {/* Reviewing Stage */}
          <div
            onClick={() => setFilter(filter === "reviewing" ? "all" : "reviewing")}
            className={`cursor-pointer rounded-2xl border-2 p-3 text-center transition-all ${
              filter === "reviewing"
                ? "border-primary/60 bg-primary/10 scale-[1.02]"
                : "border-border/80 hover:border-primary/40 bg-card"
            }`}
          >
            <span className="text-muted text-[11px] font-extrabold tracking-wider uppercase">
              Reviewing
            </span>
            <div className="text-foreground text-xl font-black sm:text-2xl">
              {reviewingWords.length}
            </div>
            <span className="text-muted text-[10px] font-bold">1–6 day interval</span>
          </div>

          {/* Mastered Stage */}
          <div
            onClick={() => setFilter(filter === "mastered" ? "all" : "mastered")}
            className={`cursor-pointer rounded-2xl border-2 p-3 text-center transition-all ${
              filter === "mastered"
                ? "border-success-border bg-success-bg/40 scale-[1.02]"
                : "border-border/80 hover:border-success-border/60 bg-card"
            }`}
          >
            <span className="text-muted text-[11px] font-extrabold tracking-wider uppercase">
              Mastered
            </span>
            <div className="text-foreground text-xl font-black sm:text-2xl">
              {masteredWords.length}
            </div>
            <span className="text-muted text-[10px] font-bold">7+ day interval</span>
          </div>
        </div>
      </Card>

      {/* Tracked Words Queue List */}
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border pb-3">
          <div className="flex items-center gap-2">
            <RefreshIcon size={18} className="text-primary" />
            <h3 className="text-foreground text-base font-black">Words in Memory</h3>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                filter === "all"
                  ? "bg-primary text-primary-fg"
                  : "bg-border/60 text-muted hover:text-foreground"
              }`}
            >
              All ({totalTracked})
            </button>
            <button
              type="button"
              onClick={() => setFilter("due")}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                filter === "due"
                  ? "bg-primary text-primary-fg"
                  : "bg-border/60 text-muted hover:text-foreground"
              }`}
            >
              Due ({dueWords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("reviewing")}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                filter === "reviewing"
                  ? "bg-primary text-primary-fg"
                  : "bg-border/60 text-muted hover:text-foreground"
              }`}
            >
              Reviewing ({reviewingWords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("mastered")}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                filter === "mastered"
                  ? "bg-primary text-primary-fg"
                  : "bg-border/60 text-muted hover:text-foreground"
              }`}
            >
              Mastered ({masteredWords.length})
            </button>
          </div>
        </div>

        {displayedWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-muted text-sm">No words found in this category.</p>
            {filter !== "all" && (
              <Button size="sm" variant="ghost" onClick={() => setFilter("all")}>
                Clear Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {displayedWords.map((item) => {
              const stage = getMasteryStage(item.srs.interval_days, item.srs.times_seen);
              const isDue = isDueForReview(item.srs.next_review_at);
              const relativeReview = formatRelativeReview(item.srs.next_review_at);

              return (
                <div
                  key={item.word.id}
                  className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => speak(item.word.word)}
                      title={`Pronounce ${item.word.word}`}
                      className="border-border hover:border-primary/50 text-muted hover:text-foreground mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border bg-card transition-colors"
                    >
                      <SpeakerIcon size={16} />
                    </button>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-base font-black">
                          {item.word.word}
                        </span>
                        <span className="text-muted text-xs font-bold italic">
                          ({item.word.part_of_speech})
                        </span>
                        {item.word.level && (
                          <span className="border-border bg-border/40 text-muted rounded-md border px-1.5 py-0.2 text-[10px] font-bold uppercase">
                            {item.word.level}
                          </span>
                        )}
                      </div>
                      <p className="text-muted line-clamp-1 text-xs">
                        {item.word.definition}
                      </p>
                    </div>
                  </div>

                  {/* SRS Stats Badges */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Streak badge */}
                    <span
                      title="Consecutive correct answers"
                      className="border-border bg-background/60 text-foreground flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold"
                    >
                      <FlameIcon size={13} className="text-amber-500" />
                      {item.srs.streak_correct}
                    </span>

                    {/* Interval badge */}
                    <span
                      title={`Interval: ${item.srs.interval_days} day(s)`}
                      className="border-border bg-background/60 text-muted flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold"
                    >
                      <ClockIcon size={13} />
                      {item.srs.interval_days}d
                    </span>

                    {/* Stage badge */}
                    {stage === "mastered" ? (
                      <span className="border-success-border bg-success-bg text-success-fg flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold">
                        <CheckIcon size={12} /> Mastered
                      </span>
                    ) : stage === "reviewing" ? (
                      <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2.5 py-0.5 text-xs font-bold">
                        Reviewing
                      </span>
                    ) : (
                      <span className="border-warning-border bg-warning-bg text-warning-fg rounded-full border px-2.5 py-0.5 text-xs font-bold">
                        Learning
                      </span>
                    )}

                    {/* Due time badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        isDue
                          ? "bg-primary text-primary-fg animate-pulse"
                          : "border-border text-muted border bg-card"
                      }`}
                    >
                      {relativeReview}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
