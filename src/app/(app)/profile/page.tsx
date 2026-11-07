import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Chip variant="points">Learner Profile</Chip>
      <div className="flex items-center gap-3">
        <Kalding mood="streak" size={100} />
        <SpeechBubble>
          Full progress stats and weakest words arrive in Phase 8!
        </SpeechBubble>
      </div>
      <Card className="flex flex-col gap-4 text-left">
        <h2 className="text-foreground text-lg font-extrabold">Coming in Phase 8</h2>
        <p className="text-muted text-sm">
          Level breakdown, streak calendar, weak word tracking, and accuracy per mode.
        </p>
        <ButtonLink href="/" size="sm" variant="secondary">
          Back to Home
        </ButtonLink>
      </Card>
    </div>
  );
}
