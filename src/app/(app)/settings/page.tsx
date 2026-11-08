import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Settings & Preferences | Kalding English",
  description: "Customize your daily goals, theme preferences, and learning settings.",
};

export default async function SettingsPage() {
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

  const initialDisplayName =
    profile?.display_name || user?.email?.split("@")[0] || "Learner";
  const initialDailyGoal = profile?.daily_goal || 100;
  const initialLanguage = profile?.language || "en";

  return (
    <SettingsForm
      initialDisplayName={initialDisplayName}
      initialDailyGoal={initialDailyGoal}
      initialLanguage={initialLanguage}
      email={user?.email || ""}
      userId={user?.id || ""}
    />
  );
}
