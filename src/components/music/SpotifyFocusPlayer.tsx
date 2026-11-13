"use client";

import { useState, useEffect } from "react";
import {
  SPOTIFY_FOCUS_PRESETS,
  DEFAULT_SPOTIFY_PRESET,
  parseSpotifyUrl,
  type SpotifyPreset,
} from "@/core/spotify";
import { HeadphonesIcon, XIcon, MusicIcon } from "@/components/ui/icons";

const STORAGE_KEY_URL = "kalding_spotify_embed_url";
const STORAGE_KEY_PRESET_ID = "kalding_spotify_preset_id";
const STORAGE_KEY_CUSTOM_LINK = "kalding_spotify_custom_link";

function getDefaultEmbedUrl(): string {
  return (
    DEFAULT_SPOTIFY_PRESET.url.replace(
      "open.spotify.com/",
      "open.spotify.com/embed/",
    ) + "?utm_source=generator&theme=0"
  );
}

export function SpotifyFocusPlayer() {
  const [isOpen, setIsOpen] = useState(false);

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_SPOTIFY_PRESET.id;
    try {
      return (
        localStorage.getItem(STORAGE_KEY_PRESET_ID) ||
        DEFAULT_SPOTIFY_PRESET.id
      );
    } catch {
      return DEFAULT_SPOTIFY_PRESET.id;
    }
  });

  const [embedUrl, setEmbedUrl] = useState<string>(() => {
    if (typeof window === "undefined") return getDefaultEmbedUrl();
    try {
      return localStorage.getItem(STORAGE_KEY_URL) || getDefaultEmbedUrl();
    } catch {
      return getDefaultEmbedUrl();
    }
  });

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLinkInput, setCustomLinkInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_LINK) || "";
    } catch {
      return "";
    }
  });
  const [customError, setCustomError] = useState<string | null>(null);

  // Keyboard shortcut: Alt + M toggles the player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectPreset = (preset: SpotifyPreset) => {
    const parsed = parseSpotifyUrl(preset.url);
    if (!parsed) return;

    setActivePresetId(preset.id);
    setEmbedUrl(parsed.embedUrl);
    setShowCustomInput(false);
    setCustomError(null);

    try {
      localStorage.setItem(STORAGE_KEY_URL, parsed.embedUrl);
      localStorage.setItem(STORAGE_KEY_PRESET_ID, preset.id);
    } catch {
      // Ignore
    }
  };

  const handleApplyCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    const parsed = parseSpotifyUrl(customLinkInput);
    if (!parsed) {
      setCustomError("Paste a valid Spotify playlist, album, or track link.");
      return;
    }

    setActivePresetId("custom");
    setEmbedUrl(parsed.embedUrl);

    try {
      localStorage.setItem(STORAGE_KEY_URL, parsed.embedUrl);
      localStorage.setItem(STORAGE_KEY_PRESET_ID, "custom");
      localStorage.setItem(STORAGE_KEY_CUSTOM_LINK, customLinkInput.trim());
    } catch {
      // Ignore
    }
  };

  const activePreset = SPOTIFY_FOCUS_PRESETS.find(
    (p) => p.id === activePresetId,
  );

  return (
    <aside
      aria-label="Spotify Focus Beats"
      className="fixed bottom-4 right-4 z-40 select-none print:hidden"
    >
      {/* COLLAPSED PILL */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="border-border bg-card/95 hover:border-primary/80 hover:bg-card text-foreground group flex items-center gap-2 rounded-full border-2 px-3.5 py-2 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          title="Open Spotify Focus Beats (Alt+M)"
        >
          <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full transition-transform group-hover:scale-110">
            <HeadphonesIcon size={14} />
          </span>
          <span className="text-xs font-black tracking-wide">Focus Beats</span>
          <span className="border-border/60 bg-background/80 text-muted rounded-full border px-2 py-0.5 text-[10px] font-bold">
            {activePreset ? `${activePreset.emoji} ${activePreset.name}` : "Music"}
          </span>
        </button>
      )}

      {/* EXPANDED MINI-PLAYER CARD */}
      {isOpen && (
        <div className="border-border bg-card/95 text-foreground flex w-80 flex-col gap-3 rounded-3xl border-2 p-3.5 shadow-2xl backdrop-blur-md sm:w-96 animate-pop">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-xl">
                <MusicIcon size={16} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-foreground text-sm font-black">Focus Beats</h3>
                  <span className="bg-[#1DB954]/15 text-[#1DB954] rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider">
                    Spotify
                  </span>
                </div>
                <span className="text-muted text-[10px] font-bold">
                  {activePreset ? activePreset.description : "Custom Study Playlist"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted hover:bg-border/60 hover:text-foreground flex size-7 items-center justify-center rounded-xl transition-colors"
              title="Minimize player (Alt+M)"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Quick Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SPOTIFY_FOCUS_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-all ${
                    isSelected
                      ? "border-primary bg-primary/15 text-primary shadow-xs"
                      : "border-border/80 bg-background/60 text-muted hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowCustomInput((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-all ${
                activePresetId === "custom" || showCustomInput
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/80 bg-background/60 text-muted hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <span>🔗</span>
              <span>Custom</span>
            </button>
          </div>

          {/* Custom Link Input Form */}
          {showCustomInput && (
            <form onSubmit={handleApplyCustomLink} className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customLinkInput}
                  onChange={(e) => {
                    setCustomLinkInput(e.target.value);
                    if (customError) setCustomError(null);
                  }}
                  placeholder="Paste Spotify playlist or album URL..."
                  className="border-border bg-background text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-primary/20 flex-1 rounded-xl border px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2"
                />
                <button
                  type="submit"
                  className="bg-primary text-on-primary hover:bg-primary/90 rounded-xl px-3 py-1.5 text-xs font-black transition-colors"
                >
                  Load
                </button>
              </div>
              {customError && (
                <span className="text-danger-fg text-[10px] font-bold">
                  {customError}
                </span>
              )}
            </form>
          )}

          {/* Spotify Official Embed iframe */}
          <div className="overflow-hidden rounded-2xl border border-border/80 shadow-inner bg-background/60">
            <iframe
              src={embedUrl}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Embed Focus Player"
              className="w-full border-0"
            />
          </div>

          {/* Helper Tips Footer */}
          <div className="flex items-center justify-between text-[10px] font-bold text-muted px-1">
            <span>Signed into Spotify in browser = full songs</span>
            <span className="border-border/60 bg-background/80 rounded px-1.5 py-0.5 font-mono">
              Alt+M
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
