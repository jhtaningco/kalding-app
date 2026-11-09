import type { Metadata } from "next";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookOpenIcon,
  ClockIcon,
  FlameIcon,
  SpeakerIcon,
  StarIcon,
  RefreshIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Practice Arena | Kalding English",
  description:
    "Choose a typing practice mode to train English vocabulary, full definitions, sentences, and typing speed.",
};

interface ModeCardInfo {
  key: string;
  href: string;
  title: string;
  tag: string;
  badgeText?: string;
  description: string;
  icon: typeof BookOpenIcon;
}

const TYPING_MODES: ModeCardInfo[] = [
  {
    key: "type_def",
    href: "/practice/type_def",
    title: "Type the Definition",
    tag: "Definition Flow",
    badgeText: "Popular",
    description:
      "Type out the complete dictionary definition character-by-character with live letter feedback and speed tracking.",
    icon: BookOpenIcon,
  },
  {
    key: "sentence_type",
    href: "/practice/sentence_type",
    title: "Sentence Transcription",
    tag: "Real Grammar",
    badgeText: "Recommended",
    description:
      "Transcribe authentic context sentences word-for-word, including punctuation and capitalization.",
    icon: StarIcon,
  },
  {
    key: "word_rush",
    href: "/practice/word_rush",
    title: "Word Rush (Stream)",
    tag: "Monkeytype Style",
    badgeText: "Speed",
    description:
      "Continuous rapid-fire vocabulary stream. Hit the Spacebar to lock in words and keep your WPM soaring!",
    icon: FlameIcon,
  },
];

const VOCAB_MODES: ModeCardInfo[] = [
  {
    key: "def_to_word",
    href: "/practice/def_to_word",
    title: "Definition → Word",
    tag: "Vocabulary Recall",
    description:
      "Read clear definitions, deduce the word, and type with instant green/red letter boxes.",
    icon: BookOpenIcon,
  },
  {
    key: "fill_blank",
    href: "/practice/fill_blank",
    title: "Fill in the Blank",
    tag: "Context & Cloze",
    description:
      "Complete real-world example sentences by typing the missing target vocabulary word.",
    icon: RefreshIcon,
  },
  {
    key: "dictation",
    href: "/practice/dictation",
    title: "Audio Dictation",
    tag: "Listening Skills",
    description:
      "Listen to natural voice audio and type the word from pronunciation alone.",
    icon: SpeakerIcon,
  },
  {
    key: "speed_run",
    href: "/practice/speed_run",
    title: "Speed Run (WPM)",
    tag: "Timed Sprint",
    description:
      "Timed typing challenge measuring words per minute, accuracy %, and streaks.",
    icon: FlameIcon,
  },
  {
    key: "word_to_def",
    href: "/practice/word_to_def",
    title: "Word → Definition",
    tag: "AI Graded",
    description:
      "Explain vocabulary in your own words and receive instant AI teacher feedback and concept matching.",
    icon: ClockIcon,
  },
];

export default function PracticeHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
      {/* Mascot & Header */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Kalding mood="happy" size={110} title="Kalding loves typing" />
        <div className="flex flex-col gap-1.5">
          <Chip variant="mode" className="self-center text-xs tracking-wider uppercase sm:self-start">
            Interactive Arena
          </Chip>
          <SpeechBubble tail="left" className="text-base sm:text-lg">
            Choose your typing workout! Type full definitions, transcribe complete sentences, or sprint through vocabulary streams.
          </SpeechBubble>
        </div>
      </div>

      {/* Vocabulary of the Day Banner */}
      <div className="border-primary/50 bg-primary/10 flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border-2 p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="border-primary/60 bg-primary text-on-primary flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm">
            <StarIcon size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-primary text-xs font-black uppercase tracking-wider">
                Daily Focus
              </span>
              <span className="border-border bg-card text-muted rounded-full border px-2 py-0.2 text-[10px] font-bold">
                +50 XP Bonus
              </span>
            </div>
            <h3 className="text-foreground text-lg font-black">
              Vocabulary of the Day
            </h3>
            <p className="text-muted text-xs">
              Focus on one featured word today with spelling, full definition typing, and sentence creation.
            </p>
          </div>
        </div>

        <ButtonLink href="/daily" size="md" className="shrink-0">
          Start Daily Word
        </ButtonLink>
      </div>

      {/* Section 1: Deep Typing & Sentence Flow */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b-2 border-border/80 pb-2">
          <h2 className="text-foreground text-lg font-black">
            Deep Typing & Sentence Flow
          </h2>
          <span className="text-muted text-xs font-bold">
            Full-text muscle memory training
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TYPING_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.key}
                className="flex flex-col justify-between gap-4 p-5 transition-all hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="border-border/80 bg-background/80 text-muted rounded-full border px-2.5 py-0.5 text-xs font-black uppercase">
                      {mode.tag}
                    </span>
                    {mode.badgeText && (
                      <span className="border-primary/40 bg-primary/10 text-primary rounded-full border px-2 py-0.2 text-[10px] font-black uppercase">
                        {mode.badgeText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="border-border bg-card flex size-8 items-center justify-center rounded-xl border">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <h3 className="text-foreground text-lg font-black">{mode.title}</h3>
                  </div>

                  <p className="text-muted text-xs leading-relaxed">{mode.description}</p>
                </div>

                <ButtonLink href={mode.href} size="md" className="w-full text-center">
                  Start Typing
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: Vocabulary & Recall Modes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b-2 border-border/80 pb-2">
          <h2 className="text-foreground text-lg font-black">
            Vocabulary & Recall Drills
          </h2>
          <span className="text-muted text-xs font-bold">
            Memory retention and listening
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {VOCAB_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.key}
                className="flex flex-col justify-between gap-4 p-5 transition-all hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex flex-col gap-2.5">
                  <span className="border-border/80 bg-background/80 text-muted self-start rounded-full border px-2.5 py-0.5 text-xs font-black uppercase">
                    {mode.tag}
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="border-border bg-card flex size-8 items-center justify-center rounded-xl border">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <h3 className="text-foreground text-base font-black">{mode.title}</h3>
                  </div>

                  <p className="text-muted text-xs leading-relaxed">{mode.description}</p>
                </div>

                <ButtonLink href={mode.href} size="sm" variant="secondary" className="w-full text-center">
                  Start Drill
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
