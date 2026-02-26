import { useState } from "react";
import { SettingsPanel } from "./SettingsPanel";

export function ToolbarPill() {
  const [active, setActive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  function toggle() {
    const next = !active;
    setActive(next);
    window.dispatchEvent(
      new CustomEvent("memzo:toggle", { detail: { visible: next } })
    );
  }

  return (
    <div style={pillStyle}>
      {/* Toggle button */}
      <button onClick={toggle} style={toggleBtnStyle} title={active ? "關閉 Memzo 字幕" : "開啟 Memzo 字幕"}>
        <span style={{ ...dotStyle, background: active ? "#4ade80" : "#6b7280" }} />
        <span style={labelStyle}>{active ? "關閉" : "開啟"}</span>
      </button>

      <div style={dividerStyle} />

      {/* Settings button */}
      <button
        onClick={() => setShowSettings((v) => !v)}
        style={iconBtnStyle}
        title="Memzo 設定"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// YouTube native button base — transparent bg, white, same font/sizing
const ytBase: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  padding: 0,
  margin: 0,
  lineHeight: 0,
  opacity: 0.9,
  fontFamily: '"YouTube Noto", Roboto, Arial, Helvetica, sans-serif',
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: "100%",
  // right border acts as separator before YT's CC/settings buttons
  borderRight: "1px solid rgba(255,255,255,0.15)",
  paddingRight: "4px",
  marginRight: "4px",
};

const toggleBtnStyle: React.CSSProperties = {
  ...ytBase,
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 500,
  letterSpacing: "0.01em",
  padding: "0 8px",
  height: "100%",
};

const dotStyle: React.CSSProperties = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  flexShrink: 0,
  transition: "background 0.2s",
};

const labelStyle: React.CSSProperties = {
  userSelect: "none",
};

const iconBtnStyle: React.CSSProperties = {
  ...ytBase,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
};

const dividerStyle: React.CSSProperties = {
  width: "1px",
  height: "18px",
  background: "rgba(255,255,255,0.2)",
  margin: "0 2px",
  flexShrink: 0,
};
