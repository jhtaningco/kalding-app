import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Chip variant="neutral">App Settings</Chip>
      <div className="flex items-center gap-3">
        <Kalding mood="neutral" size={100} />
        <SpeechBubble>Settings customization arrives in Phase 8!</SpeechBubble>
      </div>
      <Card className="flex flex-col gap-4 text-left">
        <h2 className="text-foreground text-lg font-extrabold">Coming in Phase 8</h2>
        <p className="text-muted text-sm">
          Adjust daily goals, audio preferences, and theme preferences.
        </p>
        <ButtonLink href="/" size="sm" variant="secondary">
          Back to Home
        </ButtonLink>
      </Card>
    </div>
  );
}
