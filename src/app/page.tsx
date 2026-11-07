import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Chip>Phase 1: design system</Chip>
      <div className="flex items-center gap-3">
        <Kalding mood="happy" size={120} />
        <SpeechBubble>Ready for today&apos;s words?</SpeechBubble>
      </div>
      <h1 className="text-primary text-5xl font-extrabold tracking-tight">
        Kalding English
      </h1>
      <p className="text-muted max-w-md text-lg">
        Learn English by typing. The real home screen arrives in a later phase.
      </p>
      <ButtonLink href="/design" size="lg">
        Open design page
      </ButtonLink>
    </main>
  );
}
