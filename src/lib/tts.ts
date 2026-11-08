/**
 * Browser Text-To-Speech helper using the Web Speech API (SpeechSynthesis).
 * Gracefully does nothing in SSR or unsupported environments.
 * Synchronizes with user voice preferences saved in localStorage.
 */

const VOICE_STORAGE_KEY = "kalding_voice_enabled";

export function isVoiceEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(VOICE_STORAGE_KEY) !== "false";
}

export function setVoiceEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_STORAGE_KEY, enabled ? "true" : "false");
}

export function speak(text: string, options?: { lang?: string; rate?: number }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  if (!isVoiceEnabled()) {
    return;
  }

  // Cancel any ongoing speech so clicks don't overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options?.lang ?? "en-US";
  utterance.rate = options?.rate ?? 0.95; // Slightly slower for crisp language learning clarity

  // Try to find a natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") || v.name.includes("Google")),
  );
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  window.speechSynthesis.speak(utterance);
}
