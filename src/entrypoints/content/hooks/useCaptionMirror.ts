import { useState, useEffect, useRef } from "react";
import { sendMessage } from "@/lib/messages";

interface CaptionState {
  text: string | null;
  translation: string | null;
}

/**
 * Mirrors YouTube's own CC rendering by watching .ytp-caption-window-container
 * with a MutationObserver. YouTube handles all fetch/parse/timing; we just read
 * the resulting DOM text and translate it on the fly.
 */
export function useCaptionMirror(videoId: string) {
  const [caption, setCaption] = useState<CaptionState>({ text: null, translation: null });
  const lastTextRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    function readText(): string | null {
      const container = document.querySelector(".ytp-caption-window-container");
      if (!container) return null;
      const segs = container.querySelectorAll(".ytp-caption-segment");
      if (!segs.length) return null;
      const text = Array.from(segs)
        .map((s) => s.textContent ?? "")
        .join(" ")
        .trim();
      return text || null;
    }

    function onMutation() {
      const current = readText();
      if (current === lastTextRef.current) return;
      lastTextRef.current = current;

      // Show new text immediately, clear old translation
      setCaption({ text: current, translation: null });
      if (!current) return;

      // Translate with a short debounce to avoid duplicate requests
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const res = await sendMessage({
          type: "TRANSLATE",
          texts: [current],
          videoId,
          lang: "zh-TW",
        });
        if (res.success) {
          const [translated] = res.data as string[];
          setCaption((prev) =>
            prev.text === current
              ? { text: current, translation: translated }
              : prev
          );
        }
      }, 150);
    }

    function attach() {
      const container = document.querySelector(".ytp-caption-window-container");
      if (!container) {
        retryTimer = setTimeout(attach, 500);
        return;
      }
      observer = new MutationObserver(onMutation);
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    attach();

    return () => {
      observer?.disconnect();
      clearTimeout(retryTimer);
      clearTimeout(debounceRef.current);
    };
  }, [videoId]);

  return caption;
}
