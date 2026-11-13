import { describe, expect, it } from "vitest";
import {
  buildSpotifyEmbedUrl,
  parseSpotifyUrl,
  SPOTIFY_FOCUS_PRESETS,
  DEFAULT_SPOTIFY_PRESET,
} from "./spotify";

describe("buildSpotifyEmbedUrl", () => {
  it("builds correct embed URL with theme parameters", () => {
    const url = buildSpotifyEmbedUrl("playlist", "37i9dQZF1DXdLEN7aqioXM");
    expect(url).toBe(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
    );
  });
});

describe("parseSpotifyUrl", () => {
  it("parses standard Spotify playlist web URLs", () => {
    const parsed = parseSpotifyUrl(
      "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=12345",
    );
    expect(parsed).toEqual({
      type: "playlist",
      id: "37i9dQZF1DXcBWIGoYBM5M",
      embedUrl:
        "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0",
    });
  });

  it("parses track and album URLs", () => {
    const track = parseSpotifyUrl(
      "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    );
    expect(track?.type).toBe("track");
    expect(track?.id).toBe("4cOdK2wGLETKBW3PvgPWqT");

    const album = parseSpotifyUrl(
      "https://open.spotify.com/album/41MnTivkwTO3UUo0OUq5Ki",
    );
    expect(album?.type).toBe("album");
    expect(album?.id).toBe("41MnTivkwTO3UUo0OUq5Ki");
  });

  it("parses Spotify URI format", () => {
    const parsed = parseSpotifyUrl("spotify:playlist:37i9dQZF1DXdLEN7aqioXM");
    expect(parsed).toEqual({
      type: "playlist",
      id: "37i9dQZF1DXdLEN7aqioXM",
      embedUrl:
        "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0",
    });
  });

  it("handles URLs already in embed format", () => {
    const parsed = parseSpotifyUrl(
      "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM",
    );
    expect(parsed?.id).toBe("37i9dQZF1DXdLEN7aqioXM");
    expect(parsed?.type).toBe("playlist");
  });

  it("returns null for invalid strings or empty inputs", () => {
    expect(parseSpotifyUrl("")).toBeNull();
    expect(parseSpotifyUrl("https://youtube.com/watch?v=123")).toBeNull();
    expect(parseSpotifyUrl("hello world")).toBeNull();
  });
});

describe("SPOTIFY_FOCUS_PRESETS", () => {
  it("provides valid presets with ids and spotify URLs", () => {
    expect(SPOTIFY_FOCUS_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const preset of SPOTIFY_FOCUS_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.spotifyId).toBeTruthy();
      const parsed = parseSpotifyUrl(preset.url);
      expect(parsed).not.toBeNull();
    }
    expect(DEFAULT_SPOTIFY_PRESET).toBeDefined();
  });
});
