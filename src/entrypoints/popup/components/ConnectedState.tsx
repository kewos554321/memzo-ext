import { useState, useEffect } from "react";
import type { SessionUser, CEFRLevel, LanguageCode } from "@/lib/types";
import { MEMZO_API_URL, STORAGE_KEYS } from "@/lib/constants";
import { getDifficulty } from "@/lib/wordDifficulty";
import { loadLevel } from "@/lib/difficulty/storage";

interface ConnectedStateProps {
  user: SessionUser;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const APP_URL = MEMZO_API_URL.replace(/\/api$/, "");

export function ConnectedState({ user, onLogout }: ConnectedStateProps) {
  const [userLevel, setUserLevel] = useState<CEFRLevel | null>(null);
  const [targetLang, setTargetLang] = useState<LanguageCode>("en");

  useEffect(() => {
    async function load() {
      const lang = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.TARGET_LANG}`);
      const activeLang: LanguageCode = lang ?? "en";
      setTargetLang(activeLang);
      setUserLevel(await loadLevel(activeLang));
    }
    load();
  }, []);

  // Live sync when level changes (e.g. user just completed test on YouTube page)
  useEffect(() => {
    const key = `local:${STORAGE_KEYS.USER_LEVEL_PREFIX}${targetLang}`;
    return storage.watch<CEFRLevel>(key, (val) => setUserLevel(val ?? null));
  }, [targetLang]);

  function openMemzo() {
    chrome.tabs.create({ url: APP_URL });
  }

  const difficulty = getDifficulty(targetLang);
  const levelDisplay = userLevel
    ? (difficulty ? difficulty.levelLabel(userLevel) : userLevel)
    : null;

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Connected badge */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span className="badge-connected">
          <span className="badge-dot" />
          Connected
        </span>
      </div>

      {/* User info + level */}
      <div className="clay-card" style={{ padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="avatar" aria-label={`Avatar for ${user.name}`}>
          {getInitials(user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={nameStyle}>{user.name}</p>
          <p style={emailStyle}>{user.email}</p>
        </div>
        {levelDisplay && (
          <span style={levelPillStyle}>
            {levelDisplay}
          </span>
        )}
      </div>

      {/* Prompt if no level set */}
      {!userLevel && (
        <div style={promptStyle}>
          <span style={{ fontSize: "13px" }}>💡</span>
          <p style={{ fontSize: "12px", color: "#5EEAD4", margin: 0, lineHeight: 1.4 }}>
            打開 YouTube 影片，Memzo 會自動引導你完成程度測試。
          </p>
        </div>
      )}

      <div className="divider" />

      <button className="clay-btn-outline" onClick={openMemzo}>
        Open Memzo →
      </button>
      <button className="clay-btn-ghost" onClick={onLogout}>
        登出
      </button>
    </div>
  );
}

const nameStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "15px",
  fontWeight: 600,
  color: "#134E4A",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  margin: 0,
};

const emailStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#0F766E",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginTop: "2px",
};

const levelPillStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: "3px 10px",
  borderRadius: "20px",
  border: "1.5px solid #0D9488",
  background: "rgba(13,148,136,0.15)",
  color: "#0D9488",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const promptStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  background: "rgba(13,148,136,0.06)",
  border: "1.5px dashed rgba(13,148,136,0.3)",
  borderRadius: "10px",
  padding: "10px 12px",
};
