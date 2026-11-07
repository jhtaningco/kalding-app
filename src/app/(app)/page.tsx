import { createClient } from "@/lib/supabase/server";
import { Kalding } from "@/components/kalding/Kalding";
import { SpeechBubble } from "@/components/kalding/SpeechBubble";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckIcon } from "@/components/ui/icons";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Learner";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:py-12">
      <Chip variant="mode">Phase 6: Practice Modes & Arena</Chip>

      {/* Greeting and Mascot */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
        <Kalding mood="happy" size={130} title="Kalding is happy to see you" />
        <SpeechBubble tail="left" className="text-base sm:text-lg">
          Mabuhay, <strong className="text-primary">{displayName}</strong>! All 5 practice
          modes and your spaced repetition queue are active.
        </SpeechBubble>
      </div>

      {/* Start Practice Call-to-Action */}
      <div className="border-primary/40 bg-card flex w-full flex-col items-center gap-3 rounded-3xl border-2 p-6 shadow-[0_4px_0_var(--secondary-shadow)]">
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted text-xs font-extrabold tracking-wider uppercase">
            Choose Your Challenge
          </span>
          <h2 className="text-foreground text-2xl font-extrabold sm:text-3xl">
            Practice Arena
          </h2>
          <p className="text-muted max-w-md text-sm">
            5 interactive modes: Definition, Fill in the Blank, Dictation, Speed Run, and AI-Graded Word Explanation!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <ButtonLink
            href="/practice"
            size="lg"
            className="min-w-[220px] text-lg"
          >
            Enter Practice Arena
          </ButtonLink>
          <ButtonLink
            href="/review"
            variant="secondary"
            size="lg"
            className="min-w-[200px] text-lg"
          >
            Review Queue (SRS)
          </ButtonLink>
        </div>
      </div>

      {/* Profile Details Card */}
      <Card className="flex w-full flex-col gap-4 text-left">
        <div className="border-border flex items-center justify-between border-b-2 pb-3">
          <h2 className="text-foreground text-lg font-extrabold">Profile Overview</h2>
          <span className="border-success-border bg-success-bg text-success-fg flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold">
            <CheckIcon size={14} /> Active Session
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Email
            </dt>
            <dd className="text-foreground truncate font-mono text-sm font-bold">
              {user?.email ?? "Not logged in"}
            </dd>
          </div>

          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Display Name
            </dt>
            <dd className="text-foreground truncate text-sm font-bold">
              {profile?.display_name ?? displayName}
            </dd>
          </div>

          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Learning Language
            </dt>
            <dd className="text-foreground text-sm font-bold uppercase">
              {profile?.language ?? "en"} (English)
            </dd>
          </div>

          <div className="border-border/80 bg-background/50 flex flex-col rounded-xl border p-3">
            <dt className="text-muted text-xs font-bold tracking-wider uppercase">
              Daily Goal
            </dt>
            <dd className="text-foreground text-sm font-bold">
              {profile?.daily_goal ?? 100} points / day
            </dd>
          </div>
        </dl>

        <div className="border-border mt-2 flex flex-wrap items-center justify-between gap-3 border-t-2 pt-4">
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/review" size="sm">
              Review Queue
            </ButtonLink>
            <ButtonLink href="/words" variant="secondary" size="sm">
              Word Bank
            </ButtonLink>
            <ButtonLink href="/design" variant="ghost" size="sm">
              Design System
            </ButtonLink>
          </div>

          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="ghost" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </Card>

      <p className="text-muted max-w-md text-xs">
        Words practiced in typing sessions are scheduled with SM-2 spaced repetition to ensure long-term retention.
      </p>
    </div>
  );
}
