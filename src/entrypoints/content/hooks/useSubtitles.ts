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
      // Prefer English captions; fall back to constructing a direct timedtext URL
      const enTrack =
        tracks.find((t) => t.languageCode === "en") ||
        tracks.find((t) => t.languageCode.startsWith("en")) ||
        tracks[0];

      // If no tracks found, fall back to a direct timedtext URL for ASR captions
      const subtitleUrl = enTrack?.baseUrl
        ?? `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`;

      // Fetch subtitles via background
      const subRes = await sendMessage({
        type: "FETCH_SUBTITLES",
        url: subtitleUrl,
        videoId,
      });
      if (!subRes.success) throw new Error(subRes.error);
      const rawCues = subRes.data as SubtitleCue[];
      // Merge short cues into sentence-level groups
      const merged = mergeCuesIntoSentences(rawCues);

      // Translate via background
      const texts = merged.map((c) => c.text);
      const transRes = await sendMessage({
        type: "TRANSLATE",
        texts,
        videoId,
        lang: "zh-TW",
      });

      if (transRes.success) {
        const translations = transRes.data as string[];
        merged.forEach((cue, i) => {
          cue.translation = translations[i];
        });
      }

      setCues(merged);
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
 * Merge short cues into sentence-level groups.
 * YouTube json3 often has 1-2 word fragments; we join them until we hit
 * sentence-ending punctuation (.?!) or a timing gap > 2s.
 */
function mergeCuesIntoSentences(cues: SubtitleCue[]): SubtitleCue[] {
  if (cues.length === 0) return [];

  const GAP_THRESHOLD = 2; // seconds
  const SENTENCE_END = /[.!?]$/;

  const result: SubtitleCue[] = [];
  let buf: SubtitleCue = { ...cues[0] };

  for (let i = 1; i < cues.length; i++) {
    const prev = cues[i - 1];
    const cur = cues[i];
    const gap = cur.start - prev.end;

    if (gap > GAP_THRESHOLD || SENTENCE_END.test(buf.text)) {
      result.push(buf);
      buf = { ...cur };
    } else {
      buf.text = buf.text + " " + cur.text;
      buf.end = cur.end;
    }
  }
  result.push(buf);
  return result;
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
