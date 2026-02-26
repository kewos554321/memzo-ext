import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEYS, MEMZO_API_URL } from "@/lib/constants";
import { LANGUAGES, type LanguageCode, type CEFRLevel } from "@/lib/types";
import { getDifficulty } from "@/lib/wordDifficulty";
import { loadLevel } from "@/lib/difficulty/storage";
import { sendMessage } from "@/lib/messages";
import { LevelTestDialog } from "./LevelTestDialog";

interface SettingsPanelProps {
  onClose: () => void;
}

const APP_URL = MEMZO_API_URL.replace(/\/api$/, "");

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [nativeLang, setNativeLang] = useState<LanguageCode>("zh-TW");
  const [targetLang, setTargetLang] = useState<LanguageCode>("en");
  const [userLevel, setUserLevel] = useState<CEFRLevel | null>(null);
  const [showLevelTest, setShowLevelTest] = useState(false);

  useEffect(() => {
    async function load() {
      const native = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.NATIVE_LANG}`);
      const target = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.TARGET_LANG}`);
      const activeLang: LanguageCode = target ?? "en";
      if (native) setNativeLang(native);
      if (target) setTargetLang(target);
      setUserLevel(await loadLevel(activeLang));
    }
    load();
  }, []);

  // Re-read level when targetLang changes
  useEffect(() => {
    loadLevel(targetLang).then(setUserLevel);
  }, [targetLang]);

  async function handleDone() {
    await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, nativeLang);
    await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, targetLang);
    sendMessage({ type: "SAVE_SETTINGS", nativeLang, targetLang }).catch(() => {});
    window.dispatchEvent(new CustomEvent("memzo:lang-changed"));
    onClose();
  }

  function openAdvanced() {
    window.open(`${APP_URL}/settings`, "_blank");
  }

  const difficulty = getDifficulty(targetLang);
  const levelDisplay = userLevel
    ? (difficulty ? difficulty.levelLabel(userLevel) : userLevel)
    : null;

  const panel = (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>

        {/* ── Header ── */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>Extension Settings</h2>
          <button onClick={onClose} style={closeBtnStyle} title="Close">✕</button>
        </div>

        {/* ── Native Language ── */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            <span style={labelIconStyle}>🌐</span>
            Native Language
          </label>
          <select
            value={nativeLang}
            onChange={(e) => setNativeLang(e.target.value as LanguageCode)}
            style={selectStyle}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p style={hintStyle}>Used for translations and explanations.</p>
        </div>

        {/* ── Target Language ── */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            <span style={labelIconStyle}>🎯</span>
            Target Language
          </label>
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

        <div style={dividerStyle} />

        {/* ── Learning Level (advanced, compact) ── */}
        <div style={advancedRowStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={advancedIconStyle}>📊</span>
            <div>
              <p style={advancedLabelStyle}>學習程度</p>
              <p style={advancedValueStyle}>
                {levelDisplay
                  ? <><strong>{levelDisplay}</strong> · {difficulty?.systemName ?? "CEFR"}</>
                  : <span style={{ color: "#9ca3af" }}>尚未設定</span>
                }
              </p>
            </div>
          </div>
          <button onClick={() => setShowLevelTest(true)} style={retestBtnStyle}>
            重新測試
          </button>
        </div>

        {/* ── Advanced settings link ── */}
        <button onClick={openAdvanced} style={advancedLinkStyle}>
          進階設定（詞彙、帳號…）→
        </button>

        {/* ── Done ── */}
        <button onClick={handleDone} style={doneBtnStyle}>Done</button>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(panel, document.body)}
      {showLevelTest && (
        <LevelTestDialog
          targetLang={targetLang}
          onComplete={() => setShowLevelTest(false)}
          onClose={() => setShowLevelTest(false)}
        />
      )}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  zIndex: 2147483645,
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
  display: "flex",
  flexDirection: "column",
  gap: "0",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 700,
  color: "#111827",
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

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const labelIconStyle: React.CSSProperties = {
  fontSize: "14px",
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

const dividerStyle: React.CSSProperties = {
  height: "1px",
  background: "#f3f4f6",
  margin: "2px 0 16px",
};

const advancedRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  background: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "10px",
};

const advancedIconStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1,
};

const advancedLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#6b7280",
};

const advancedValueStyle: React.CSSProperties = {
  margin: "1px 0 0",
  fontSize: "13px",
  color: "#374151",
};

const retestBtnStyle: React.CSSProperties = {
  padding: "5px 12px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const advancedLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "4px 0",
  fontSize: "12px",
  color: "#6b7280",
  cursor: "pointer",
  textAlign: "left",
  textDecoration: "underline",
  marginBottom: "16px",
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
};
