import type { SubtitleCue } from "@/lib/types";

interface YouTubeTimedText {
  events: {
    tStartMs: number;
    dDurationMs: number;
    segs?: { utf8: string }[];
  }[];
}

export async function fetchSubtitles(url: string): Promise<SubtitleCue[]> {
  // YouTube baseUrl uses HTML entities (&amp;) — decode before use
  const decodedUrl = url.replace(/&amp;/g, "&");

  // Ensure we request JSON format
  const jsonUrl = decodedUrl.includes("fmt=json3")
    ? decodedUrl
    : `${decodedUrl}&fmt=json3`;

  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Failed to fetch subtitles: ${res.status}`);

  const data: YouTubeTimedText = await res.json();

  return data.events
    .filter((e) => e.segs && e.segs.length > 0)
    .map((e) => ({
      start: e.tStartMs / 1000,
      end: (e.tStartMs + e.dDurationMs) / 1000,
      text: e.segs!.map((s) => s.utf8).join("").trim(),
    }))
    .filter((cue) => cue.text.length > 0);
}
