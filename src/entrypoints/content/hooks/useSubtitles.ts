import { useState, useEffect, useCallback } from "react";
import type { SubtitleCue, CaptionTrack } from "@/lib/types";
import { sendMessage } from "@/lib/messages";

export function useSubtitles(videoId: string | null) {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubtitles = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);

    try {
      // Extract caption tracks from page
      const tracks = extractCaptionTracks();
      if (!tracks || tracks.length === 0) {
        setError("No captions available");
        setLoading(false);
        return;
      }

      // Prefer English captions
      const enTrack =
        tracks.find((t) => t.languageCode === "en") ||
        tracks.find((t) => t.languageCode.startsWith("en")) ||
        tracks[0];

      // Fetch subtitles via background
      const subRes = await sendMessage({
        type: "FETCH_SUBTITLES",
        url: enTrack.baseUrl,
        videoId,
      });
      if (!subRes.success) throw new Error(subRes.error);
      const fetchedCues = subRes.data as SubtitleCue[];

      // Translate via background
      const texts = fetchedCues.map((c) => c.text);
      const transRes = await sendMessage({
        type: "TRANSLATE",
        texts,
        videoId,
        lang: "zh-TW",
      });

      if (transRes.success) {
        const translations = transRes.data as string[];
        fetchedCues.forEach((cue, i) => {
          cue.translation = translations[i];
        });
      }

      setCues(fetchedCues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subtitles");
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadSubtitles();
  }, [loadSubtitles]);

  return { cues, loading, error, reload: loadSubtitles };
}

function extractCaptionTracks(): CaptionTrack[] {
  // First: try YouTube player DOM API (works for both direct load and SPA navigation)
  try {
    const player = document.querySelector("#movie_player") as Record<string, unknown> | null;
    if (typeof player?.getPlayerResponse === "function") {
      const response = (player.getPlayerResponse as () => Record<string, unknown>)();
      const tracks = (response?.captions as Record<string, unknown>)
        ?.playerCaptionsTracklistRenderer as Record<string, unknown>;
      if (tracks?.captionTracks) {
        return tracks.captionTracks as CaptionTrack[];
      }
    }
  } catch {
    // ignore
  }

  // Fallback: try extracting from ytInitialPlayerResponse in page scripts (direct load)
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    const text = script.textContent || "";
    const match = text.match(
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});/s
    );
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        return (
          data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
        );
      } catch {
        continue;
      }
    }
  }

  // Fallback: captured via fetch hook on SPA navigation
  try {
    const w = window as unknown as Record<string, unknown>;
    const playerResponse = w.__memzo_player_response as Record<string, unknown> | undefined;
    if (playerResponse) {
      const captions = playerResponse.captions as Record<string, unknown> | undefined;
      const trackList = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
      return (trackList?.captionTracks as CaptionTrack[]) || [];
    }
  } catch {
    // ignore
  }

  return [];
}
