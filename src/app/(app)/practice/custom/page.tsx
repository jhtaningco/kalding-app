import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserGamification } from "@/lib/gamification/getUserGamification";
import { CustomTextEngine } from "@/components/practice/CustomTextEngine";

export const metadata: Metadata = {
  title: "Paste & Type | Kalding English",
  description:
    "Paste any custom English text, article, or essay to practice typing with live cursor, WPM, and gamified XP rewards.",
};

export default async function CustomPracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialPoints = 0;
  let initialStreak = 0;

  if (user) {
    const gamification = await getUserGamification(supabase, user.id);
    initialPoints = gamification.totalXp;
    initialStreak = gamification.streak.currentStreak;
  }

  return (
    <CustomTextEngine
      initialPoints={initialPoints}
      initialStreak={initialStreak}
      userId={user?.id}
    />
  );
}
