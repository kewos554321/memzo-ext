import { useState, useEffect } from "react";
import type { SubtitleCue, Collection } from "@/lib/types";
import { useVideoTime } from "../hooks/useVideoTime";
import { useSubtitles } from "../hooks/useSubtitles";
import { sendMessage } from "@/lib/messages";
import { STORAGE_KEYS } from "@/lib/constants";
import { WordSpan } from "./WordSpan";

interface SubtitleOverlayProps {
  videoId: string;
}

export function SubtitleOverlay({ videoId }: SubtitleOverlayProps) {
  const currentTime = useVideoTime();
  const { cues, loading, error } = useSubtitles(videoId);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedDeckId] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  // Load collections and selected deck
  useEffect(() => {
    async function load() {
      const authRes = await sendMessage({ type: "GET_AUTH_STATE" });
      if (!authRes.success) return;
      const { token } = authRes.data as { token: string | null };
      if (!token) return;

      const colRes = await sendMessage({ type: "GET_COLLECTIONS" });
      if (colRes.success) {
        setCollections(colRes.data as Collection[]);
      }

      const savedCollection = await storage.getItem<string>(
        `local:${STORAGE_KEYS.SELECTED_COLLECTION}`
      );
      if (savedCollection) setSelectedDeckId(savedCollection);
    }
    load();
  }, []);

  // Find current cue
  const activeCue = cues.find(
    (c) => currentTime >= c.start && currentTime < c.end
  );

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: "absolute",
          bottom: "80px",
          right: "16px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "12px",
          cursor: "pointer",
          zIndex: 99999,
        }}
      >
        CC
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        pointerEvents: "auto",
        textAlign: "center",
        maxWidth: "80%",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setVisible(false)}
        style={{
          position: "absolute",
          top: "-28px",
          right: "-12px",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "22px",
          height: "22px",
          fontSize: "12px",
          cursor: "pointer",
          lineHeight: "22px",
        }}
      >
        ×
      </button>

      {loading && (
        <div style={subtitleStyle}>Loading subtitles...</div>
      )}
      {error && (
        <div style={subtitleStyle}>{error}</div>
      )}

      {activeCue && (
        <div style={subtitleStyle}>
          {/* English line - hoverable words */}
          <div style={{ marginBottom: "4px", fontSize: "18px" }}>
            {splitIntoWords(activeCue.text).map((part, i) => (
              <span key={i}>
                {part === " " ? (
                  " "
                ) : (
                  <WordSpan
                    word={part}
                    collections={collections}
                    selectedCollectionId={selectedCollectionId}
                  />
                )}
              </span>
            ))}
          </div>
          {/* Chinese translation */}
          {activeCue.translation && (
            <div style={{ fontSize: "16px", color: "#f9e2af" }}>
              {activeCue.translation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const subtitleStyle: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.75)",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: "8px",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  lineHeight: "1.6",
  backdropFilter: "blur(4px)",
};

function splitIntoWords(text: string): string[] {
  // Split while preserving spaces as separate items
  return text.split(/(\s+)/).filter((s) => s.length > 0);
}
