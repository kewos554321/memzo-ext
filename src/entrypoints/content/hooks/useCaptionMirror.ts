import { useState, useEffect, useRef, useCallback } from "react";
import { useSubtitles } from "./useSubtitles";
import { useVideoTime } from "./useVideoTime";

// Translation cache shared across renders
const translationCache = new Map<string, string>();
const pendingTranslations = new Set<string>();

async function translateViaBackground(text: string, lang: string): Promise<void> {
  if (!text || translationCache.has(text) || pendingTranslations.has(text)) return;
  pendingTranslations.add(text);
  try {
    const res = await browser.runtime.sendMessage({
      type: "TRANSLATE",
      texts: [text],
      videoId: "",
      lang,
    });
    if (res?.success) {
      const [translated] = res.data as string[];
      if (translated) translationCache.set(text, translated);
    }
  } catch {
    // ignore
  } finally {
    pendingTranslations.delete(text);
  }
}

interface CaptionState {
  text: string | null;
  translation: string | null;
}

export function useCaptionMirror(videoId: string, nativeLang: string = "zh-TW") {
  const { cues } = useSubtitles(videoId, nativeLang);
  const currentTime = useVideoTime();
  const langRef = useRef(nativeLang);

  // Keep langRef current so the closed-over interval can use latest lang
  useEffect(() => {
    langRef.current = nativeLang;
  }, [nativeLang]);

  // Clear caches when language changes so translations are re-fetched
  useEffect(() => {
    translationCache.clear();
    pendingTranslations.clear();
  }, [nativeLang]);

  // ── DOM caption: poll YouTube's hidden CC text every 150ms ──
  // Always active — acts as safety net when time-based lookup has no match
  // (between sentences, before first cue, subtitle fetch failed, etc.)
  const [domCaption, setDomCaption] = useState<CaptionState>({ text: null, translation: null });
  // pendingTextRef: latest raw text from DOM (may still be mid-sentence)
  // lastShownTextRef: text currently displayed to the user
  const pendingTextRef = useRef<string | null>(null);
  const lastShownTextRef = useRef<string | null>(null);
  const displayDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function readDomText(): string | null {
      // Try specific container + window first (avoids stacking from multiple windows)
      const container =
        document.querySelector(".ytp-caption-window-container") ??
        document.querySelector(".caption-window-container");

      if (container) {
        const windows = container.querySelectorAll(".ytp-caption-window, .caption-window");
        const lastWindow = windows[windows.length - 1];
        if (lastWindow) {
          const segs = lastWindow.querySelectorAll("span.ytp-caption-segment");
          if (segs.length) {
            return Array.from(segs).map((s) => s.textContent ?? "").join("").trim() || null;
          }
        }
      }

      // Fallback: query all caption segments directly (works even if container class changed)
      const allSegs = document.querySelectorAll("span.ytp-caption-segment");
      if (allSegs.length) {
        return Array.from(allSegs).map((s) => s.textContent ?? "").join("").trim() || null;
      }

      return null;
    }

    function showStable(text: string) {
      if (text === lastShownTextRef.current) return;
      lastShownTextRef.current = text;
      setDomCaption({ text, translation: translationCache.get(text) ?? null });

      // Start translation immediately — no extra debounce needed here
      // (display is already debounced by 300ms before showStable is called)
      translateViaBackground(text, langRef.current).then(() => {
        setDomCaption((prev) => {
          if (prev.text !== text) return prev;
          const t = translationCache.get(text);
          return t ? { text, translation: t } : prev;
        });
      });
    }

    function check() {
      const text = readDomText();

      if (!text) {
        // Caption ended — clear immediately, cancel any pending display
        if (pendingTextRef.current !== null || lastShownTextRef.current !== null) {
          pendingTextRef.current = null;
          lastShownTextRef.current = null;
          clearTimeout(displayDebounceRef.current);
          clearTimeout(translateDebounceRef.current);
          setDomCaption({ text: null, translation: null });
        }
        return;
      }

      if (text === pendingTextRef.current) return; // no change
      pendingTextRef.current = text;

      // Debounce display so we only show once YouTube stops adding words to the phrase.
      // This prevents word-by-word flickering in the DOM fallback mode.
      clearTimeout(displayDebounceRef.current);
      displayDebounceRef.current = setTimeout(() => {
        const stable = pendingTextRef.current;
        if (stable) showStable(stable);
      }, 300);
    }

    check(); // immediate first read
    const intervalId = setInterval(check, 150);

    return () => {
      clearInterval(intervalId);
      clearTimeout(displayDebounceRef.current);
    };
  }, []); // no deps — always runs for the lifetime of this component

  // ── Time-based cue lookup from pre-fetched sentence-level subtitles ──
  const lastCueIndexRef = useRef<number>(-1);

  const findCueIndex = useCallback(
    (time: number): number => {
      if (!cues.length) return -1;
      let lo = 0;
      let hi = cues.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const cue = cues[mid];
        if (time < cue.start) hi = mid - 1;
        else if (time > cue.end) lo = mid + 1;
        else return mid;
      }
      return -1;
    },
    [cues]
  );

  const [timeCue, setTimeCue] = useState<CaptionState | null>(null);

  useEffect(() => {
    if (!cues.length) {
      setTimeCue(null);
      lastCueIndexRef.current = -1;
      return;
    }

    const idx = findCueIndex(currentTime);

    if (idx === -1) {
      if (lastCueIndexRef.current !== -1) {
        lastCueIndexRef.current = -1;
        setTimeCue(null);
      }
      return;
    }

    if (idx === lastCueIndexRef.current) return;
    lastCueIndexRef.current = idx;

    const cue = cues[idx];
    setTimeCue({ text: cue.text, translation: cue.translation ?? null });
  }, [currentTime, findCueIndex, cues]);

  // Prefer sentence-level pre-fetched cue (complete sentence + pre-translated).
  // Fall back to YouTube CC DOM text when no cue is matched
  // (before first cue, between sentences, or when subtitle fetch failed).
  return timeCue ?? domCaption;
}
