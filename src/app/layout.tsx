import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Nunito } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalding English",
  description: "Learn English by typing: vocabulary, spelling, and grammar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script sets data-theme before React hydrates.
    <html
      lang="en"
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
