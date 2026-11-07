"use client";

import { useState } from "react";
import type { Tables } from "@/types/database";
import type { LevelInfo } from "@/core/levels";
import type { StreakResult } from "@/core/streak";
import type { WeakWordStat, HeatmapDay } from "@/core/stats";
import { Kalding } from "@/components/kalding/Kalding";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FlameIcon,
  StarIcon,
  CheckIcon,
  SpeakerIcon,
  ClockIcon,
  BookOpenIcon,
} from "@/components/ui/icons";
import { speak } from "@/lib/tts";
import { PracticeEngine } from "../practice/[mode]/practice-engine";

export interface WeakWordWithDetails extends WeakWordStat {
  word: Tables<"words">;
}

export interface ProfileViewProps {
  displayName: string;
  email: string;
  joinedDate: string;
  levelInfo: LevelInfo;
  streak: StreakResult;
  overallAccuracy: number;
  totalTimeFormatted: string;
  totalAttemptsCount: number;
  masteredWordsCount: number;
  heatmapDays: HeatmapDay[];
  weakWords: WeakWordWithDetails[];
  recentAttempts: {
    id: string;
    wordText: string;
    mode: string;
    correct: boolean;
    accuracy: number;
    pointsEarned: number;
    createdAt: string;
  }[];
  userId?: string;
}

export function ProfileView({
  displayName,
  email,
  joinedDate,
  levelInfo,
  streak,
  overallAccuracy,
  totalTimeFormatted,
  totalAttemptsCount,
  masteredWordsCount,
  heatmapDays,
  weakWords,
  recentAttempts,
  userId,
}: ProfileViewProps) {
  const [isDrillingWeakWords, setIsDrillingWeakWords] = useState(false);

  if (isDrillingWeakWords && weakWords.length > 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <PracticeEngine
          words={weakWords.map((w) => w.word)}
          mode="def_to_word"
          modeName="Targeted Weak Words Drill"
          initialPoints={levelInfo.totalXp}
          initialStreak={streak.currentStreak}
          userId={userId}
        />
      </div>
    );
  }

  const activeDaysLast30 = heatmapDays.filter((d) => d.practiced).length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      {/* Header Profile Hero */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Kalding mood="streak" size={120} title="Kalding celebrating your journey" />
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="border-primary/40 bg-primary/10 text-primary flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black">
              <StarIcon size={13} /> Level {levelInfo.level} • {levelInfo.title}
            </span>
            <span className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black">
              <FlameIcon size={13} /> {streak.currentStreak} Day Streak
            </span>
          </div>

          <h1 className="text-foreground text-2xl font-black sm:text-3xl">{displayName}</h1>
          <p className="text-muted text-xs font-semibold">
            {email} • Joined {joinedDate} • {totalAttemptsCount} total exercises completed
          </p>
        </div>
      </div>

      {/* 4 Lifetime Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Stat 1: Total Practice Time */}
        <Card className="flex flex-col gap-1 p-4 text-center">
          <div className="flex items-center justify-center text-primary">
            <ClockIcon size={20} />
          </div>
          <span className="text-foreground text-xl font-black sm:text-2xl">
            {totalTimeFormatted}
          </span>
          <span className="text-muted text-[11px] font-extrabold uppercase">
            Practice Time
          </span>
        </Card>

        {/* Stat 2: Overall Accuracy */}
        <Card className="flex flex-col gap-1 p-4 text-center">
          <div className="flex items-center justify-center text-emerald-500">
            <CheckIcon size={20} />
          </div>
          <span className="text-foreground text-xl font-black sm:text-2xl">
            {overallAccuracy}%
          </span>
          <span className="text-muted text-[11px] font-extrabold uppercase">
            Avg Accuracy
          </span>
        </Card>

        {/* Stat 3: Mastered Words */}
        <Card className="flex flex-col gap-1 p-4 text-center">
          <div className="flex items-center justify-center text-sky-500">
            <BookOpenIcon size={20} />
          </div>
          <span className="text-foreground text-xl font-black sm:text-2xl">
            {masteredWordsCount}
          </span>
          <span className="text-muted text-[11px] font-extrabold uppercase">
            Mastered Words
          </span>
        </Card>

        {/* Stat 4: Longest Streak */}
        <Card className="flex flex-col gap-1 p-4 text-center">
          <div className="flex items-center justify-center text-amber-500">
            <FlameIcon size={20} />
          </div>
          <span className="text-foreground text-xl font-black sm:text-2xl">
            {streak.longestStreak}d
          </span>
          <span className="text-muted text-[11px] font-extrabold uppercase">
            Best Streak
          </span>
        </Card>
      </div>

      {/* 30-Day Activity Calendar Heatmap */}
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlameIcon size={18} className="text-amber-500" />
            <h2 className="text-foreground text-base font-black">
              30-Day Practice Activity
            </h2>
          </div>
          <span className="text-muted text-xs font-bold">
            {activeDaysLast30} of 30 days active
          </span>
        </div>

        <div className="grid grid-cols-10 gap-2 pt-2 sm:grid-cols-15">
          {heatmapDays.map((d) => (
            <div
              key={d.date}
              title={`${d.date} (${d.dayName}): ${d.practiced ? "Practiced" : "No practice"}`}
              className={`flex size-7 items-center justify-center rounded-xl border-2 text-[10px] font-black transition-all ${
                d.practiced
                  ? "border-success-border bg-success-bg text-success-fg scale-105"
                  : d.isToday
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-muted"
              }`}
            >
              {d.date.slice(8, 10)}
            </div>
          ))}
        </div>
      </Card>

      {/* Weakest Words Section */}
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-3">
          <div className="flex flex-col">
            <h2 className="text-foreground text-lg font-black">
              Words to Strengthen
            </h2>
            <p className="text-muted text-xs font-medium">
              Words where you encountered the most typos or incorrect answers.
            </p>
          </div>

          {weakWords.length > 0 && (
            <Button
              size="sm"
              onClick={() => setIsDrillingWeakWords(true)}
              className="text-xs"
            >
              Drill Weak Words ({weakWords.length})
            </Button>
          )}
        </div>

        {weakWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-muted text-sm font-semibold">
              No weak words detected yet! Excellent typing accuracy so far.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {weakWords.map((w) => (
              <div
                key={w.wordId}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => speak(w.word.word)}
                    title={`Pronounce ${w.word.word}`}
                    className="border-border hover:border-primary/50 text-muted hover:text-foreground mt-0.5 flex size-8 items-center justify-center rounded-xl border bg-card transition-colors"
                  >
                    <SpeakerIcon size={16} />
                  </button>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-base font-black">
                        {w.word.word}
                      </span>
                      <span className="text-muted text-xs italic">
                        ({w.word.part_of_speech})
                      </span>
                    </div>
                    <p className="text-muted line-clamp-1 text-xs">
                      {w.word.definition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="border-warning-border bg-warning-bg text-warning-fg rounded-full border px-2.5 py-0.5 text-xs font-black">
                    {w.mistakes} mistake{w.mistakes === 1 ? "" : "s"}
                  </span>
                  <span className="border-border bg-card text-muted rounded-full border px-2 py-0.5 text-xs font-extrabold">
                    {w.accuracy}% accuracy
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Practice History */}
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <h2 className="text-foreground text-base font-black border-b-2 border-border pb-3">
          Recent Attempt History
        </h2>

        {recentAttempts.length === 0 ? (
          <p className="text-muted py-4 text-center text-sm font-semibold">
            No attempts recorded yet. Start practicing to build your history!
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {recentAttempts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-black ${
                      a.correct
                        ? "bg-success-bg text-success-fg"
                        : "bg-danger-bg text-danger-fg"
                    }`}
                  >
                    {a.correct ? "✓" : "✗"}
                  </span>
                  <span className="text-foreground font-black">{a.wordText}</span>
                  <span className="text-muted text-[11px] capitalize">({a.mode.replace(/_/g, " ")})</span>
                </div>

                <div className="flex items-center gap-2">
                  {a.pointsEarned > 0 && (
                    <span className="text-success-fg font-black">+{a.pointsEarned} pts</span>
                  )}
                  <span className="text-muted text-[11px]">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Navigation Footer */}
      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <ButtonLink href="/settings" variant="secondary" size="md">
          Open Settings
        </ButtonLink>
        <ButtonLink href="/practice" size="md">
          Practice Arena
        </ButtonLink>
      </div>
    </div>
  );
}
