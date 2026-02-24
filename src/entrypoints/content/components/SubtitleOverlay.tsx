import { useState, useEffect } from "react";
import type { Collection } from "@/lib/types";
import { useCaptionMirror } from "../hooks/useCaptionMirror";
import { sendMessage } from "@/lib/messages";
import { STORAGE_KEYS } from "@/lib/constants";
import { WordSpan } from "./WordSpan";

interface SubtitleOverlayProps {
  videoId: string;
}

export function SubtitleOverlay({ videoId }: SubtitleOverlayProps) {
  const { text, translation } = useCaptionMirror(videoId);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  // Listen for toolbar pill toggle
  useEffect(() => {
    function handler(e: Event) {
      setVisible((e as CustomEvent<{ visible: boolean }>).detail.visible);
    }
    window.addEventListener("memzo:toggle", handler);
    return () => window.removeEventListener("memzo:toggle", handler);
  }, []);

  // Load collections
  useEffect(() => {
    async function load() {
      const authRes = await sendMessage({ type: "GET_AUTH_STATE" });
      if (!authRes.success) return;
      const { token } = authRes.data as { token: string | null };
      if (!token) return;

      const colRes = await sendMessage({ type: "GET_COLLECTIONS" });
      if (colRes.success) setCollections(colRes.data as Collection[]);

      const saved = await storage.getItem<string>(
        `local:${STORAGE_KEYS.SELECTED_COLLECTION}`
      );
      if (saved) setSelectedCollectionId(saved);
    }
    load();
  }, []);

  if (!visible || !text) return null;

  return (
    <div style={outerStyle}>
      <div style={subtitleStyle}>
        {/* English — hoverable words */}
        <div style={{ marginBottom: "4px", fontSize: "18px" }}>
          {splitIntoWords(text).map((part, i) =>
            part === " " ? (
              <span key={i}> </span>
            ) : (
              <WordSpan
                key={i}
                word={part}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
              />
            )
          )}
        </div>

        {/* Chinese translation */}
        {translation && (
          <div style={{ fontSize: "16px", color: "#f9e2af" }}>{translation}</div>
        )}
      </div>
    </div>
  );
}

const outerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "80px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 2001,
  pointerEvents: "none",
  textAlign: "center",
  maxWidth: "80%",
};

const subtitleStyle: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.75)",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "8px",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  lineHeight: "1.6",
  backdropFilter: "blur(4px)",
  pointerEvents: "auto",
};

function splitIntoWords(text: string): string[] {
  return text.split(/(\s+)/).filter((s) => s.length > 0);
}
