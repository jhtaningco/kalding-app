export type SpotifyEmbedType =
  | "playlist"
  | "track"
  | "album"
  | "artist"
  | "episode"
  | "show";

export interface SpotifyPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: SpotifyEmbedType;
  spotifyId: string;
  url: string;
}

export const SPOTIFY_FOCUS_PRESETS: SpotifyPreset[] = [
  {
    id: "lofi-beats",
    name: "Lofi Study",
    emoji: "☕",
    description: "Chill beats to focus & transcribe",
    type: "playlist",
    spotifyId: "37i9dQZF1DXdLEN7aqioXM",
    url: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM",
  },
  {
    id: "deep-focus",
    name: "Deep Focus",
    emoji: "🧠",
    description: "Ambient study & alpha waves",
    type: "playlist",
    spotifyId: "37i9dQZF1DWZeKCadgRdKQ",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    id: "peaceful-piano",
    name: "Piano Focus",
    emoji: "🎹",
    description: "Calm instrumental piano melodies",
    type: "playlist",
    spotifyId: "37i9dQZF1DX4sWSpwq3LiO",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
  },
  {
    id: "synthwave-flow",
    name: "Synthwave",
    emoji: "⚡",
    description: "High-octane retro flow for fast WPM",
    type: "playlist",
    spotifyId: "37i9dQZF1DXd9rSD9ocZq7",
    url: "https://open.spotify.com/playlist/37i9dQZF1DXd9rSD9ocZq7",
  },
];

export const DEFAULT_SPOTIFY_PRESET = SPOTIFY_FOCUS_PRESETS[0];

/**
 * Builds the official Spotify Embed player URL with dark mode styling.
 */
export function buildSpotifyEmbedUrl(type: SpotifyEmbedType, id: string): string {
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

export interface ParsedSpotifyResult {
  type: SpotifyEmbedType;
  id: string;
  embedUrl: string;
}

/**
 * Parses user-provided Spotify links (URLs or URIs) into a valid embed source.
 * Supports:
 * - https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
 * - https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
 * - https://open.spotify.com/album/41MnTivkwTO3UUo0OUq5Ki
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 * - Already formatted embed URLs
 */
export function parseSpotifyUrl(input: string): ParsedSpotifyResult | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // 1. Spotify URI format: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const uriMatch = trimmed.match(/^spotify:(playlist|track|album|artist|episode|show):([a-zA-Z0-9]+)$/);
  if (uriMatch) {
    const type = uriMatch[1] as SpotifyEmbedType;
    const id = uriMatch[2];
    return {
      type,
      id,
      embedUrl: buildSpotifyEmbedUrl(type, id),
    };
  }

  // 2. Standard web URL: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
  // Or embed URL: https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?open\.spotify\.com\/(?:embed\/)?(playlist|track|album|artist|episode|show)\/([a-zA-Z0-9]+)/,
  );

  if (urlMatch) {
    const type = urlMatch[1] as SpotifyEmbedType;
    const id = urlMatch[2];
    return {
      type,
      id,
      embedUrl: buildSpotifyEmbedUrl(type, id),
    };
  }

  return null;
}

export interface CustomSpotifyPlaylist {
  id: string;
  name: string;
  emoji: string;
  url: string;
  embedUrl: string;
  spotifyId: string;
  type: SpotifyEmbedType;
  createdAt: number;
}

export type CreateCustomPlaylistResult =
  | { success: true; playlist: CustomSpotifyPlaylist }
  | { success: false; error: string };

/**
 * Validates and constructs a CustomSpotifyPlaylist entity.
 */
export function createCustomSpotifyPlaylist(
  name: string,
  url: string,
  emoji = "🎧",
): CreateCustomPlaylistResult {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Playlist name cannot be empty." };
  }
  if (trimmedName.length > 40) {
    return {
      success: false,
      error: "Playlist name must be 40 characters or fewer.",
    };
  }

  const parsed = parseSpotifyUrl(url);
  if (!parsed) {
    return {
      success: false,
      error: "Please enter a valid Spotify playlist, album, or track URL.",
    };
  }

  const cleanEmoji = emoji.trim() || "🎧";

  return {
    success: true,
    playlist: {
      id: `spotify-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      emoji: cleanEmoji,
      url: url.trim(),
      embedUrl: parsed.embedUrl,
      spotifyId: parsed.id,
      type: parsed.type,
      createdAt: Date.now(),
    },
  };
}
