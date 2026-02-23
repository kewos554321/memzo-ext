import type { DictionaryEntry } from "@/lib/types";

interface TooltipProps {
  entry: DictionaryEntry | null;
  word: string;
  saving: boolean;
  saved: boolean;
  canSave: boolean;
  onSave: (translation: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function Tooltip({
  entry,
  word,
  saving,
  saved,
  canSave,
  onSave,
  onMouseEnter,
  onMouseLeave,
}: TooltipProps) {
  const firstDef = entry?.meanings[0]?.definitions[0]?.definition;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e1e2e",
        color: "#cdd6f4",
        borderRadius: "8px",
        padding: "12px 16px",
        minWidth: "240px",
        maxWidth: "360px",
        fontSize: "14px",
        lineHeight: "1.5",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        zIndex: 999999,
        textAlign: "left",
        whiteSpace: "normal",
      }}
    >
      {/* Word + Phonetic */}
      <div style={{ marginBottom: "6px" }}>
        <span style={{ fontWeight: 700, fontSize: "16px", color: "#cba6f7" }}>
          {word}
        </span>
        {entry?.phonetic && (
          <span style={{ marginLeft: "8px", color: "#a6adc8", fontSize: "13px" }}>
            {entry.phonetic}
          </span>
        )}
      </div>

      {/* Definitions */}
      {entry ? (
        <div style={{ marginBottom: "8px" }}>
          {entry.meanings.slice(0, 2).map((m, i) => (
            <div key={i} style={{ marginBottom: "4px" }}>
              <span
                style={{
                  color: "#94e2d5",
                  fontSize: "12px",
                  fontStyle: "italic",
                  marginRight: "6px",
                }}
              >
                {m.partOfSpeech}
              </span>
              <span style={{ color: "#cdd6f4" }}>
                {m.definitions[0]?.definition}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#a6adc8", marginBottom: "8px" }}>
          No definition found
        </div>
      )}

      {/* Save button */}
      {canSave && (
        <button
          onClick={() => onSave(firstDef || word)}
          disabled={saving || saved}
          style={{
            display: "block",
            width: "100%",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: saved || saving ? "default" : "pointer",
            fontSize: "13px",
            fontWeight: 600,
            background: saved ? "#a6e3a1" : "#cba6f7",
            color: "#1e1e2e",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saved ? "Saved!" : saving ? "Saving..." : "Save to Collection"}
        </button>
      )}
    </div>
  );
}
