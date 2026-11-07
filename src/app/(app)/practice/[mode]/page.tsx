import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Chip variant="mode">Practice: {mode}</Chip>
      <div className="flex items-center gap-3">
        <Kalding mood="thinking" size={100} />
        <SpeechBubble>Practice modes are being prepared for Phase 4 & 6!</SpeechBubble>
      </div>
      <Card className="flex flex-col gap-4 text-left">
        <h2 className="text-foreground text-lg font-extrabold">Coming in Phase 4</h2>
        <p className="text-muted text-sm">
          Interactive typing practice, live letter coloring, SRS scheduling, and instant
          feedback.
        </p>
        <ButtonLink href="/" size="sm" variant="secondary">
          Back to Home
        </ButtonLink>
      </Card>
    </div>
  );
}
