import type { SubtitleCue } from "@/lib/types";

interface YouTubeTimedText {
  events: {
    tStartMs: number;
    dDurationMs: number;
    segs?: { utf8: string }[];
  }[];
}

export async function fetchSubtitles(url: string): Promise<SubtitleCue[]> {
  // 1. Decode HTML entities (ytInitialPlayerResponse uses &amp; instead of &)
  let decoded = url.replace(/&amp;/g, "&");

  // 2. Ensure absolute URL (some baseUrls are protocol-relative: //www.youtube.com/...)
  if (decoded.startsWith("//")) decoded = `https:${decoded}`;

  // 3. Force fmt=json3 — use URLSearchParams.set() to replace any existing fmt param
  const urlObj = new URL(decoded);
  urlObj.searchParams.set("fmt", "json3");
  const jsonUrl = urlObj.toString();

  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Subtitle fetch failed: HTTP ${res.status}`);

  // Read text first for a meaningful error if the body isn't valid JSON
  const text = await res.text();
  if (!text.trim()) throw new Error("Subtitle API returned empty response");

  let data: YouTubeTimedText;
  try {
    data = JSON.parse(text) as YouTubeTimedText;
  } catch {
    throw new Error(`Subtitle response is not JSON (got: ${text.slice(0, 120)})`);
  }

  return data.events
    .filter((e) => e.segs && e.segs.length > 0)
    .map((e) => ({
      start: e.tStartMs / 1000,
      end: (e.tStartMs + e.dDurationMs) / 1000,
      text: e.segs!.map((s) => s.utf8).join("").trim(),
    }))
    .filter((cue) => cue.text.length > 0);
}
