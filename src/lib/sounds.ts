/**
 * Lightweight synth sound effects using the browser Web Audio API.
 * No external sound files needed. Gracefully does nothing in SSR.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Pleasant ascending two-tone chime for correct answers.
 */
export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Ascending melody: C5 (523Hz) -> G5 (784Hz)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(783.99, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Ignore audio permission or playback errors
  }
}

/**
 * Soft, gentle downward tone for mistakes or skipped words (never harsh).
 */
export function playWrongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    // Soft low tone descending: 330Hz -> 260Hz
    osc.frequency.setValueAtTime(329.63, now);
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.2);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Ignore audio errors
  }
}
