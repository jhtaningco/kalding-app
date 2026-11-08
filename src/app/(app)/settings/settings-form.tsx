"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { isSoundEnabled as getSoundEnabled, setSoundEnabled as saveSoundEnabled } from "@/lib/sounds";
import { isVoiceEnabled as getVoiceEnabled, setVoiceEnabled as saveVoiceEnabled } from "@/lib/tts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { CheckIcon, SunIcon, MoonIcon, SpeakerIcon } from "@/components/ui/icons";

interface SettingsFormProps {
  initialDisplayName: string;
  initialDailyGoal: number;
  initialLanguage: string;
  email: string;
  userId: string;
}

const GOAL_OPTIONS = [
  { value: 50, label: "Casual", description: "50 points (~1 session/day)" },
  { value: 100, label: "Standard (Recommended)", description: "100 points (~2 sessions/day)" },
  { value: 150, label: "Dedicated", description: "150 points (~3 sessions/day)" },
  { value: 200, label: "Intense", description: "200 points (~4+ sessions/day)" },
];

export function SettingsForm({
  initialDisplayName,
  initialDailyGoal,
  initialLanguage,
  email,
  userId,
}: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [dailyGoal, setDailyGoal] = useState(initialDailyGoal);
  const [language] = useState(initialLanguage);
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundEnabled());
  const [voiceEnabled, setVoiceEnabled] = useState(() => getVoiceEnabled());

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    saveSoundEnabled(nextVal);
  };

  const handleToggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    saveVoiceEnabled(nextVal);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  let mood: KaldingMood = "neutral";
  let speech = "Customize your daily goals, sound effects, and learning preferences.";

  if (isSaving) {
    mood = "thinking";
    speech = "Saving your changes...";
  } else if (feedback?.type === "success") {
    mood = "celebrate";
    speech = feedback.text;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        daily_goal: dailyGoal,
        language,
      })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ type: "error", text: `Failed to save: ${error.message}` });
    } else {
      setFeedback({ type: "success", text: "Settings saved successfully!" });
      router.refresh();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      {/* Header with Mascot */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Kalding mood={mood} size={110} title={`Kalding is ${mood}`} />
        <div className="flex flex-col gap-1.5">
          <Chip variant="neutral" className="self-center text-xs tracking-wider uppercase sm:self-start">
            Preferences & Settings
          </Chip>
          <SpeechBubble tail="left" className="text-base">
            {speech}
          </SpeechBubble>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Account & Profile Card */}
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="text-foreground text-base font-black border-b-2 border-border pb-2.5">
            Learner Profile
          </h2>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="displayName"
              className="text-foreground text-xs font-black uppercase tracking-wider"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-border bg-card text-foreground focus:border-primary rounded-xl border-2 px-3.5 py-2.5 font-bold transition-colors focus:outline-none"
              placeholder="Your learner name"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted text-xs font-black uppercase tracking-wider">
              Account Email
            </span>
            <input
              type="email"
              value={email}
              disabled
              className="border-border bg-background/50 text-muted cursor-not-allowed rounded-xl border p-2.5 font-mono text-xs font-bold"
            />
          </div>
        </Card>

        {/* Daily Goal Target */}
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col">
            <h2 className="text-foreground text-base font-black">
              Daily Practice Target
            </h2>
            <p className="text-muted text-xs font-medium">
              Choose how many points you want to aim for every day to stay on track.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDailyGoal(opt.value)}
                className={`flex flex-col rounded-2xl border-2 p-3 text-left transition-all ${
                  dailyGoal === opt.value
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/80 hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-black">{opt.label}</span>
                  {dailyGoal === opt.value && (
                    <span className="text-primary">
                      <CheckIcon size={16} />
                    </span>
                  )}
                </div>
                <span className="text-muted text-xs">{opt.description}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Display & Sound Preferences */}
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="text-foreground text-base font-black border-b-2 border-border pb-2.5">
            Display & Sound
          </h2>

          {/* Theme Toggle Row */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-bold">App Color Theme</span>
              <span className="text-muted text-xs">Switch between bright daylight and dark mode</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="border-border hover:border-primary/50 text-foreground flex items-center gap-2 rounded-xl border-2 bg-card px-3.5 py-2 text-xs font-black transition-colors"
            >
              {theme === "dark" ? (
                <>
                  <MoonIcon size={16} /> Dark Mode
                </>
              ) : (
                <>
                  <SunIcon size={16} /> Light Mode
                </>
              )}
            </button>
          </div>

          {/* Audio Chimes Toggle Row */}
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-bold">Typing Sound Effects</span>
              <span className="text-muted text-xs">Play chime on correct answer and cue on oops</span>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition-colors ${
                soundEnabled
                  ? "border-success-border bg-success-bg text-success-fg"
                  : "border-border bg-card text-muted"
              }`}
            >
              <SpeakerIcon size={16} />
              {soundEnabled ? "Enabled" : "Muted"}
            </button>
          </div>

          {/* Voice Pronunciation TTS Row */}
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-bold">Voice Pronunciation</span>
              <span className="text-muted text-xs">Speak words and example sentences using text-to-speech</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition-colors ${
                voiceEnabled
                  ? "border-success-border bg-success-bg text-success-fg"
                  : "border-border bg-card text-muted"
              }`}
            >
              <SpeakerIcon size={16} />
              {voiceEnabled ? "Enabled" : "Muted"}
            </button>
          </div>
        </Card>

        {/* Save Status and Submit */}
        {feedback && (
          <div
            className={`rounded-2xl border-2 p-3 text-center text-xs font-bold ${
              feedback.type === "success"
                ? "border-success-border bg-success-bg text-success-fg"
                : "border-danger-border bg-danger-bg text-danger-fg"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <Button type="submit" size="lg" disabled={isSaving} className="w-full text-base">
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </form>

      {/* Danger Zone */}
      <Card tone="danger" className="flex flex-col gap-3 p-5 sm:p-6 mt-4">
        <h2 className="text-danger-fg text-base font-black">Account Session</h2>
        <p className="text-muted text-xs leading-relaxed">
          Sign out of your active session on this device. Your points, levels, and SRS progress remain safely preserved in the database.
        </p>

        <form action="/api/auth/signout" method="POST" className="pt-2">
          <Button type="submit" variant="danger" size="md">
            Sign Out
          </Button>
        </form>
      </Card>
    </div>
  );
}
