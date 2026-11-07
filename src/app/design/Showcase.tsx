import type { ReactNode } from "react";
import { Kalding, type KaldingMood } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { TopBar } from "@/components/layout/TopBar";
import { StreakChip } from "@/components/gamification/StreakChip";
import { PointsChip } from "@/components/gamification/PointsChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CheckIcon,
  LightbulbIcon,
  SpeakerIcon,
  StarIcon,
  XIcon,
} from "@/components/ui/icons";
import { FeedbackDemo } from "./FeedbackDemo";

const swatches = [
  ["background", "Background"],
  ["card", "Card"],
  ["border", "Border"],
  ["foreground", "Text"],
  ["muted", "Muted text"],
  ["primary", "Primary"],
  ["primary-shadow", "Primary shadow"],
  ["progress", "Progress"],
  ["streak-bg", "Streak bg"],
  ["streak-fg", "Streak text"],
  ["points-bg", "Points bg"],
  ["points-fg", "Points text"],
  ["success-bg", "Success bg"],
  ["danger-bg", "Danger bg"],
  ["letter-correct", "Letter correct"],
  ["letter-wrong", "Letter wrong"],
] as const;

const moods: KaldingMood[] = [
  "neutral",
  "happy",
  "oops",
  "celebrate",
  "streak",
  "thinking",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-muted text-sm font-extrabold tracking-wider uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Static preview of live letter colouring: green = correct, red = wrong, grey = still to type. */
function TypingPreview() {
  const target = "resilient";
  const typed = "resilxe";
  return (
    <div
      aria-label="Typing preview"
      className="border-border bg-card rounded-2xl border-2 px-5 py-4 font-mono text-2xl tracking-wide"
    >
      {target.split("").map((char, i) => {
        const hasTyped = i < typed.length;
        const correct = hasTyped && typed[i] === char;
        return (
          <span key={i}>
            {i === typed.length && (
              <span
                aria-hidden="true"
                className="animate-blink bg-primary -mx-px inline-block h-7 w-0.5 translate-y-1"
              />
            )}
            <span
              className={
                !hasTyped
                  ? "text-letter-pending"
                  : correct
                    ? "text-letter-correct"
                    : "bg-danger-bg text-letter-wrong rounded-sm"
              }
            >
              {hasTyped ? typed[i] : char}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Everything the design system offers. Rendered once per theme on /design. */
export function Showcase() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Colour tokens">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {swatches.map(([token, label]) => (
            <li key={token} className="flex flex-col gap-1">
              <span
                className="border-border h-10 rounded-xl border-2"
                style={{ background: `var(--${token})` }}
              />
              <span className="text-muted text-xs font-bold">{label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Check</Button>
          <Button variant="secondary">Skip</Button>
          <Button variant="ghost">Hint</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">
            <CheckIcon size={22} /> Continue
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm">
            <LightbulbIcon size={20} /> Hint
          </Button>
          <Button variant="secondary" size="sm">
            <SpeakerIcon size={20} /> Replay
          </Button>
          <Button variant="secondary" size="sm" aria-label="Close" className="w-11 !px-0">
            <XIcon size={20} />
          </Button>
        </div>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap items-center gap-3">
          <Chip variant="mode">Definition to Word</Chip>
          <StreakChip days={7} />
          <PointsChip points={240} />
          <Chip>
            <StarIcon size={16} /> Level 3
          </Chip>
        </div>
      </Section>

      <Section title="Progress bars">
        <div className="flex flex-col gap-3">
          <ProgressBar label="Empty" value={0} />
          <ProgressBar label="Session progress" value={4} max={10} />
          <ProgressBar label="Daily goal" value={72} max={100} size="sm" />
          <ProgressBar label="Complete" value={10} max={10} />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4 text-sm font-bold">Default card</Card>
          <Card tone="success" className="p-4 text-sm font-bold">
            Correct answer
          </Card>
          <Card tone="danger" className="p-4 text-sm font-bold">
            Gentle correction
          </Card>
        </div>
      </Section>

      <Section title="Typing feedback">
        <TypingPreview />
      </Section>

      <Section title="Top bar">
        <div className="border-border overflow-hidden rounded-2xl border-2">
          <TopBar
            sticky={false}
            hideThemeToggle
            exitHref="/design"
            progress={{ value: 3, max: 10 }}
            streak={5}
            points={120}
          />
        </div>
      </Section>

      <Section title="Kalding moods">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {moods.map((m) => (
            <li
              key={m}
              className="border-border bg-card flex flex-col items-center gap-1 rounded-2xl border-2 p-3"
            >
              <Kalding mood={m} size={104} title={`Kalding, ${m}`} />
              <span className="text-muted text-xs font-extrabold uppercase">{m}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Kalding body and speech bubble">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border-2 p-4">
          <Kalding mood="body" size={150} title="Kalding standing, one hoof raised" />
          <SpeechBubble>Ready for today&apos;s words?</SpeechBubble>
        </div>
      </Section>

      <Section title="Feedback animations (try it)">
        <FeedbackDemo />
      </Section>
    </div>
  );
}
