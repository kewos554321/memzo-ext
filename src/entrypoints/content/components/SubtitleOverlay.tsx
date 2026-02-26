import { useState, useEffect } from "react";
import type { Deck, CEFRLevel } from "@/lib/types";
import { useCaptionMirror } from "../hooks/useCaptionMirror";
import { useLanguageSettings } from "../hooks/useLanguageSettings";
import { sendMessage } from "@/lib/messages";
import { STORAGE_KEYS } from "@/lib/constants";
import { loadLevel } from "@/lib/difficulty/storage";
import { WordSpan, syncVocabStatus } from "./WordSpan";
import { LevelTestDialog } from "./LevelTestDialog";

interface SubtitleOverlayProps {
  videoId: string;
}

export function SubtitleOverlay({ videoId }: SubtitleOverlayProps) {
  const { nativeLang, targetLang, loaded: langLoaded } = useLanguageSettings();
  const { text, translation } = useCaptionMirror(videoId, nativeLang);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLevelTest, setShowLevelTest] = useState(false);

  // Listen for toolbar pill toggle
  useEffect(() => {
    function handler(e: Event) {
      setVisible((e as CustomEvent<{ visible: boolean }>).detail.visible);
    }
    window.addEventListener("memzo:toggle", handler);
    return () => window.removeEventListener("memzo:toggle", handler);
  }, []);

  // Load auth + decks (run once)
  useEffect(() => {
    async function load() {
      const authRes = await sendMessage({ type: "GET_AUTH_STATE" });
      if (!authRes.success) return;
      const { token } = authRes.data as { token: string | null };
      if (!token) return;
      setIsAuthenticated(true);

      const vocabRes = await sendMessage({ type: "GET_VOCAB_WORDS" });
      if (vocabRes.success) syncVocabStatus(vocabRes.data as string[]);

      const colRes = await sendMessage({ type: "GET_DECKS" });
      if (colRes.success) setDecks(colRes.data as Deck[]);

      const saved = await storage.getItem<string>(`local:${STORAGE_KEYS.SELECTED_DECK}`);
      if (saved) setSelectedDeckId(saved);
    }
    load();
  }, []);

  // Check level only after language settings have loaded from storage
  // (langLoaded = true once local storage has been read by useLanguageSettings)
  useEffect(() => {
    if (!langLoaded || !isAuthenticated) return;
    loadLevel(targetLang).then((lvl) => {
      if (!lvl) setShowLevelTest(true);
    });
  }, [langLoaded, isAuthenticated, targetLang]);

  return (
    <>
      {showLevelTest && (
        <LevelTestDialog
          targetLang={targetLang}
          onComplete={(_level: CEFRLevel) => setShowLevelTest(false)}
          onClose={() => setShowLevelTest(false)}
        />
      )}
      {visible && text && <SubtitleBox
        text={text}
        translation={translation}
        isAuthenticated={isAuthenticated}
        decks={decks}
        selectedDeckId={selectedDeckId}
        nativeLang={nativeLang}
        targetLang={targetLang}
      />}
    </>
  );
}

function SubtitleBox({ text, translation, isAuthenticated, decks, selectedDeckId, nativeLang, targetLang }: {
  text: string;
  translation: string | null;
  isAuthenticated: boolean;
  decks: Deck[];
  selectedDeckId: string | null;
  nativeLang: string;
  targetLang: ReturnType<typeof useLanguageSettings>["targetLang"];
}) {
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
                currentSubtitle={text}
                isAuthenticated={isAuthenticated}
                decks={decks}
                selectedDeckId={selectedDeckId}
                nativeLang={nativeLang}
                targetLang={targetLang}
              />
            )
          )}
        </div>

        {/* Chinese translation — show placeholder while fetching */}
        <div style={{ fontSize: "16px", color: translation ? "#f9e2af" : "rgba(249,226,175,0.45)" }}>
          {translation ?? "翻譯中..."}
        </div>
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
