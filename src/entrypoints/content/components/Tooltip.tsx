import { useState, useEffect } from "react";
import type { DictionaryEntry, WordStatus } from "@/lib/types";
import { sendMessage } from "@/lib/messages";

interface TooltipProps {
  entry: DictionaryEntry | null;
  word: string;
  status: WordStatus | null;
  saving: boolean;
  canSave: boolean;
  onStatusChange: (next: WordStatus | null) => void;
  onSave: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const POS_ABBR: Record<string, string> = {
  noun: "n.",
  verb: "v.",
  adjective: "adj.",
  adverb: "adv.",
  pronoun: "pron.",
  preposition: "prep.",
  conjunction: "conj.",
  interjection: "int.",
  article: "art.",
  determiner: "det.",
};

function abbr(pos: string) {
  return POS_ABBR[pos.toLowerCase()] ?? pos;
}

export function Tooltip({
  entry,
  word,
  status,
  saving,
  canSave,
  onStatusChange,
  onSave,
  onMouseEnter,
  onMouseLeave,
}: TooltipProps) {
  const [zhMeanings, setZhMeanings] = useState<string[] | null>(null);

  // Translate definitions to Chinese
  useEffect(() => {
    if (!entry) return;
    const defs = entry.meanings
      .slice(0, 3)
      .map((m) => m.definitions[0]?.definition)
      .filter(Boolean) as string[];
    if (!defs.length) return;

    sendMessage({ type: "TRANSLATE", texts: defs, videoId: "", lang: "zh-TW" })
      .then((res) => {
        if (res.success) setZhMeanings(res.data as string[]);
      });
  }, [entry]);

  function playAudio() {
    if (entry?.audioUrl) {
      new Audio(entry.audioUrl).play().catch(() => {});
    }
  }

  // Build meaning lines: "v. 移動；行進"
  const meaningLines = entry?.meanings.slice(0, 3).map((m, i) => {
    const pos = abbr(m.partOfSpeech);
    const zh = zhMeanings?.[i];
    const en = m.definitions[0]?.definition ?? "";
    return { pos, text: zh || en };
  });

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={containerStyle}
    >
      {/* Word + phonetic + audio */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontWeight: 700, fontSize: "16px", color: "#f4f4f5" }}>
          {word}
        </span>
        {entry?.phonetic && (
          <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
            {entry.phonetic}
          </span>
        )}
        {entry?.audioUrl && (
          <button onClick={playAudio} style={audioBtnStyle} title="發音">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          </button>
        )}
      </div>

      {/* Meanings */}
      {entry ? (
        <div style={{ marginBottom: "10px" }}>
          {meaningLines?.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: "5px", marginBottom: "3px", fontSize: "13px" }}>
              <span style={{ color: "#60a5fa", fontStyle: "italic", flexShrink: 0 }}>
                {line.pos}
              </span>
              <span style={{ color: "#d4d4d8" }}>{line.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#71717a", fontSize: "13px", marginBottom: "10px" }}>
          查無此字
        </div>
      )}

      {/* Status buttons */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={() => onStatusChange(status === "learning" ? null : "learning")}
          style={statusBtnStyle(status === "learning", "blue")}
        >
          <span style={{ fontSize: "13px" }}>📖</span>
          {status === "learning" ? "取消學習" : "學習中"}
        </button>
        <button
          onClick={() => onStatusChange(status === "mastered" ? null : "mastered")}
          style={statusBtnStyle(status === "mastered", "green")}
        >
          <span style={{ fontSize: "13px" }}>✓</span>
          {status === "mastered" ? "取消掌握" : "已掌握"}
        </button>
      </div>

      {/* Save to collection */}
      {canSave && (
        <button
          onClick={onSave}
          disabled={saving}
          style={{ ...saveCardBtnStyle, opacity: saving ? 0.5 : 1 }}
        >
          {saving ? "儲存中…" : "＋ 加入單字卡"}
        </button>
      )}

      {/* Arrow */}
      <div style={arrowStyle} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 10px)",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#18181b",
  color: "#f4f4f5",
  borderRadius: "10px",
  padding: "12px 14px",
  minWidth: "220px",
  maxWidth: "300px",
  fontSize: "14px",
  lineHeight: "1.5",
  boxShadow: "0 12px 32px rgba(0,0,0,0.65)",
  border: "1px solid rgba(255,255,255,0.1)",
  zIndex: 999999,
  textAlign: "left",
  whiteSpace: "normal",
  pointerEvents: "auto",
};

const audioBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#60a5fa",
  cursor: "pointer",
  padding: "2px",
  lineHeight: 0,
  borderRadius: "4px",
  display: "inline-flex",
  alignItems: "center",
};

function statusBtnStyle(active: boolean, color: "blue" | "green"): React.CSSProperties {
  const activeColor = color === "blue"
    ? { bg: "rgba(59,130,246,0.2)", border: "rgba(96,165,250,0.6)", text: "#93c5fd" }
    : { bg: "rgba(16,185,129,0.2)", border: "rgba(52,211,153,0.6)", text: "#6ee7b7" };

  return {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "5px 8px",
    borderRadius: "7px",
    border: `1px solid ${active ? activeColor.border : "rgba(255,255,255,0.12)"}`,
    background: active ? activeColor.bg : "transparent",
    color: active ? activeColor.text : "#a1a1aa",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  };
}

const saveCardBtnStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "8px",
  padding: "5px 0",
  borderRadius: "7px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#a1a1aa",
  fontSize: "12px",
  cursor: "pointer",
  textAlign: "center",
};

const arrowStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "-6px",
  left: "50%",
  transform: "translateX(-50%) rotate(45deg)",
  width: "10px",
  height: "10px",
  background: "#18181b",
  borderRight: "1px solid rgba(255,255,255,0.1)",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};
