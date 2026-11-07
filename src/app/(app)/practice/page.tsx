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
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Practice Modes | Kalding English",
  description:
    "Choose a typing practice mode to train English vocabulary, listening, context, and fluency.",
};

interface ModeCardInfo {
  key: string;
  href: string;
  title: string;
  tag: string;
  description: string;
  icon: typeof BookOpenIcon;
  color: string;
}

const MODES: ModeCardInfo[] = [
  {
    key: "def_to_word",
    href: "/practice/def_to_word",
    title: "Definition → Word",
    tag: "Vocabulary Recall",
    description:
      "Read clear definitions, deduce the word, and type with instant green/red letter feedback.",
    icon: BookOpenIcon,
    color: "primary",
  },
  {
    key: "fill_blank",
    href: "/practice/fill_blank",
    title: "Fill in the Blank",
    tag: "Context & Grammar",
    description:
      "Complete real-world example sentences by typing the missing target vocabulary word.",
    icon: StarIcon,
    color: "amber-500",
  },
  {
    key: "dictation",
    href: "/practice/dictation",
    title: "Audio Dictation",
    tag: "Listening Skills",
    description:
      "Listen to natural voice audio and type the word from pronunciation alone.",
    icon: SpeakerIcon,
    color: "sky-500",
  },
  {
    key: "speed_run",
    href: "/practice/speed_run",
    title: "Speed Run (WPM)",
    tag: "Fluency & Reflexes",
    description:
      "Fast-paced typing challenge measuring your words per minute, accuracy, and streaks.",
    icon: FlameIcon,
    color: "rose-500",
  },
  {
    key: "word_to_def",
    href: "/practice/word_to_def",
    title: "Word → Definition",
    tag: "AI Graded Explanation",
    description:
      "Explain vocabulary in your own words and receive instant AI teacher feedback and scoring.",
    icon: ClockIcon,
    color: "emerald-500",
  },
];

export default function PracticeHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      {/* Mascot & Header */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Kalding mood="happy" size={110} title="Kalding loves practice" />
        <div className="flex flex-col gap-1.5">
          <Chip variant="mode" className="self-center text-xs tracking-wider uppercase sm:self-start">
            Practice Arena
          </Chip>
          <SpeechBubble tail="left" className="text-base sm:text-lg">
            Choose your practice mode! Each mode exercises a different angle of your English vocabulary mastery.
          </SpeechBubble>
        </div>
      </div>

      {/* Grid of All 5 Practice Modes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card
              key={mode.key}
              className="flex flex-col justify-between gap-4 p-6 transition-all hover:border-primary/60 hover:shadow-md"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="border-border/80 bg-background/80 text-muted rounded-full border px-2.5 py-0.5 text-xs font-black uppercase">
                    {mode.tag}
                  </span>
                  <div className="border-border bg-card flex size-9 items-center justify-center rounded-xl border">
                    <Icon size={18} className="text-primary" />
                  </div>
                </div>

                <h3 className="text-foreground text-xl font-black">{mode.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{mode.description}</p>
              </div>

              <ButtonLink href={mode.href} size="md" className="w-full text-center">
                Start Session
              </ButtonLink>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
