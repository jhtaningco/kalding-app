import type { Metadata, Viewport } from "next";
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
  title: {
    default: "Kalding English | Master Vocabulary by Typing",
    template: "%s | Kalding English",
  },
  description:
    "Learn English through engaging typing drills, spaced repetition vocabulary, sentence transcriptions, and instant AI grading featuring Kalding the goat mascot.",
  keywords: [
    "English typing",
    "vocabulary builder",
    "spaced repetition",
    "typing tutor",
    "Kalding",
    "learn English",
  ],
  authors: [{ name: "Kalding English" }],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B132B" },
    { media: "(prefers-color-scheme: light)", color: "#1CB0F6" },
  ],
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
