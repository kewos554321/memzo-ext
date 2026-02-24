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
      // Extract caption tracks; if not ready yet, wait for page script signal
      let tracks = extractCaptionTracks();
      if (!tracks || tracks.length === 0) {
        tracks = await waitForCaptionTracks(6000);
      }
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

/** Read caption tracks stored in DOM dataset by the injected page script */
function extractCaptionTracks(): CaptionTrack[] {
  try {
    const stored = document.documentElement.dataset.memzoCaptionTracks;
    if (stored) {
      const parsed = JSON.parse(stored) as CaptionTrack[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Wait up to `timeout` ms for the page script to store caption tracks.
 * Resolves immediately if already available, otherwise waits for
 * the `memzo:tracks-ready` CustomEvent dispatched on `document`.
 */
function waitForCaptionTracks(timeout: number): Promise<CaptionTrack[]> {
  return new Promise((resolve) => {
    const immediate = extractCaptionTracks();
    if (immediate.length > 0) { resolve(immediate); return; }

    const handler = () => {
      clearTimeout(timer);
      document.removeEventListener("memzo:tracks-ready", handler);
      resolve(extractCaptionTracks());
    };

    document.addEventListener("memzo:tracks-ready", handler);

    const timer = setTimeout(() => {
      document.removeEventListener("memzo:tracks-ready", handler);
      resolve([]);
    }, timeout);
  });
}
