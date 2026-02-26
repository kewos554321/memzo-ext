import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEYS } from "@/lib/constants";
import { LANGUAGES, type LanguageCode } from "@/lib/types";
import { sendMessage } from "@/lib/messages";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [nativeLang, setNativeLang] = useState<LanguageCode>("zh-TW");
  const [targetLang, setTargetLang] = useState<LanguageCode>("en");

  useEffect(() => {
    async function load() {
      const native = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.NATIVE_LANG}`);
      const target = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.TARGET_LANG}`);
      if (native) setNativeLang(native);
      if (target) setTargetLang(target);
    }
    load();
  }, []);

  async function handleDone() {
    await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, nativeLang);
    await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, targetLang);
    // Sync both fields to server in background
    sendMessage({ type: "SAVE_SETTINGS", nativeLang, targetLang }).catch(() => {});
    window.dispatchEvent(new CustomEvent("memzo:lang-changed"));
    onClose();
  }

  const panel = (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            Extension Settings
          </h2>
          <button onClick={onClose} style={closeBtnStyle} title="Close">✕</button>
        </div>

        {/* Native Language */}
        <div style={sectionStyle}>
          <div style={labelRowStyle}>
            <span style={{ fontSize: "14px" }}>🌐</span>
            <span style={labelStyle}>Native Language</span>
          </div>
          <select
            value={nativeLang}
            onChange={(e) => setNativeLang(e.target.value as LanguageCode)}
            style={selectStyle}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p style={hintStyle}>Language for translations and explanations.</p>
        </div>

        {/* Target Language */}
        <div style={sectionStyle}>
          <div style={labelRowStyle}>
            <span style={{ fontSize: "14px" }}>🎯</span>
            <span style={labelStyle}>Target Language</span>
          </div>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
            style={selectStyle}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p style={hintStyle}>The language you are learning.</p>
        </div>

        {/* Done button */}
        <button onClick={handleDone} style={doneBtnStyle}>Done</button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  zIndex: 2147483646,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "24px",
  width: "380px",
  maxWidth: "calc(100vw - 32px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  fontFamily: "'Segoe UI', Arial, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "20px",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
  color: "#6b7280",
  padding: "4px",
  lineHeight: 1,
  borderRadius: "4px",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const labelRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  color: "#111827",
  background: "#fff",
  cursor: "pointer",
  outline: "none",
};

const hintStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "#9ca3af",
};

const doneBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "4px",
};
