import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Design system | Kalding English",
  robots: { index: false },
};

function ThemePanel({
  theme,
  children,
}: {
  theme: "light" | "dark";
  children: ReactNode;
}) {
  return (
    // Forces the tokens for this subtree, so both themes show at once.
    <div
      data-theme={theme}
      className="border-border bg-background text-foreground rounded-3xl border-2 p-5 sm:p-6"
    >
      <h2 className="mb-6 text-2xl font-extrabold">
        {theme === "light" ? "Light theme" : "Dark theme"}
      </h2>
      {children}
    </div>
  );
}

export default function DesignPage() {
  return (
    <>
      <TopBar progress={{ value: 3, max: 10 }} streak={5} points={120} exitHref="/" />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-4xl font-extrabold">Design system</h1>
        <p className="text-muted mt-2 mb-8 max-w-2xl">
          The bar above and this page background follow your saved theme; use its toggle
          to test remembering the choice after a reload. The two panels below are forced
          to light and dark so you can compare every component and mood side by side.
        </p>
        <div className="grid gap-6 xl:grid-cols-2">
          <ThemePanel theme="light">
            <Showcase />
          </ThemePanel>
          <ThemePanel theme="dark">
            <Showcase />
          </ThemePanel>
        </div>
      </main>
    </>
  );
}
