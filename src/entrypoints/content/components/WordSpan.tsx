import { useState, useRef, useEffect } from "react";
import type { DictionaryEntry, Deck, WordStatus, CEFRLevel, LanguageCode } from "@/lib/types";
import { sendMessage } from "@/lib/messages";
import { STORAGE_KEYS } from "@/lib/constants";
import { YoutubeAdapter } from "@/lib/sources/youtube";
import { Tooltip } from "./Tooltip";
import { getDifficulty, isInLearningZone } from "@/lib/wordDifficulty";

interface WordSpanProps {
  word: string;
  currentSubtitle: string;
  isAuthenticated: boolean;
  decks: Deck[];
  selectedDeckId: string | null;
  nativeLang?: string;
  targetLang?: LanguageCode;
}

// Module-level word status cache shared across all WordSpan instances
let statusMap: Record<string, WordStatus> = {};
let statusLoaded = false;

// Module-level user level cache (per language)
const cachedUserLevels: Partial<Record<LanguageCode, CEFRLevel | null>> = {};
const levelWatched = new Set<LanguageCode>();
// React components subscribe here to re-render when a level changes
const levelListeners = new Map<LanguageCode, Set<() => void>>();

function notifyLevelListeners(lang: LanguageCode) {
  levelListeners.get(lang)?.forEach((fn) => fn());
}

async function loadUserLevel(lang: LanguageCode) {
  if (cachedUserLevels[lang] !== undefined) return;
  cachedUserLevels[lang] = null; // mark as loading

  const lvl = await storage.getItem<CEFRLevel>(
    `local:${STORAGE_KEYS.USER_LEVEL_PREFIX}${lang}`
  );
  cachedUserLevels[lang] = lvl ?? null;
  notifyLevelListeners(lang);

  // Watch for live updates (user retakes test, changes level on web)
  if (!levelWatched.has(lang)) {
    levelWatched.add(lang);
    storage.watch<CEFRLevel>(
      `local:${STORAGE_KEYS.USER_LEVEL_PREFIX}${lang}`,
      (newVal) => {
        cachedUserLevels[lang] = newVal ?? null;
        notifyLevelListeners(lang);
      }
    );
  }
}

// Module-level: tracks the hide function of the currently visible tooltip
// so entering a new word immediately hides the previous one
let globalHideTooltip: (() => void) | null = null;

async function loadStatuses() {
  if (statusLoaded) return;
  statusLoaded = true;
  const data = await storage.getItem<Record<string, WordStatus>>(
    `local:${STORAGE_KEYS.WORD_STATUSES}`
  );
  if (data) statusMap = data;
}

// Called by SubtitleOverlay after DB sync — marks captured words as "learning" if not already set
export function syncVocabStatus(vocabWords: string[]) {
  for (const w of vocabWords) {
    if (!statusMap[w]) statusMap[w] = "learning";
  }
}

async function saveStatus(word: string, status: WordStatus | null) {
  const key = word.toLowerCase();
  if (status === null) {
    delete statusMap[key];
  } else {
    statusMap[key] = status;
  }
  await storage.setItem(`local:${STORAGE_KEYS.WORD_STATUSES}`, statusMap);
}

export function WordSpan({ word, currentSubtitle, isAuthenticated, decks, selectedDeckId, nativeLang, targetLang = "en" }: WordSpanProps) {
  const [entry, setEntry] = useState<DictionaryEntry | null | undefined>(undefined);
  const [showTooltip, setShowTooltip] = useState(false);
  const [status, setStatus] = useState<WordStatus | null>(null);
  const [userLevel, setUserLevel] = useState<CEFRLevel | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isWord = /^[a-zA-Z'-]+$/.test(word);

  // Load word status on mount
  useEffect(() => {
    if (!isWord) return;
    loadStatuses().then(() => {
      setStatus(statusMap[word.toLowerCase()] ?? null);
    });
  }, [word, isWord]);

  // Subscribe to user level — triggers re-render when level loads or changes
  useEffect(() => {
    if (!isWord) return;
    if (!levelListeners.has(targetLang)) levelListeners.set(targetLang, new Set());
    const update = () => setUserLevel(cachedUserLevels[targetLang] ?? null);
    levelListeners.get(targetLang)!.add(update);

    if (cachedUserLevels[targetLang] !== undefined) {
      // Already cached: apply immediately
      update();
    } else {
      // Not cached yet: load will notify when ready
      loadUserLevel(targetLang);
    }

    return () => { levelListeners.get(targetLang)?.delete(update); };
  }, [isWord, targetLang]);

  function handleMouseEnter() {
    if (!isWord) return;
    clearTimeout(hideTimerRef.current);

    // Hover-intent: only show after cursor rests for 200ms
    showTimerRef.current = setTimeout(async () => {
      // Immediately hide any other visible tooltip
      if (globalHideTooltip) {
        globalHideTooltip();
        globalHideTooltip = null;
      }
      globalHideTooltip = () => setShowTooltip(false);

      setShowTooltip(true);
      if (entry === undefined) {
        const res = await sendMessage({ type: "LOOKUP_WORD", word });
        setEntry(res.success ? (res.data as DictionaryEntry | null) : null);
      }
    }, 200);
  }

  function handleMouseLeave() {
    clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
      globalHideTooltip = null;
    }, 80);
  }

  async function handleStatusChange(next: WordStatus | null) {
    setStatus(next);
    await saveStatus(word, next);
    if (next !== null && isAuthenticated) {
      const definition = entry
        ? entry.meanings[0]?.definitions[0]?.definition || word
        : word;
      const source = new YoutubeAdapter(currentSubtitle, word).getContext();
      sendMessage({
        type: "CAPTURE_WORD",
        word,
        definition,
        phonetic: entry?.phonetic,
        audioUrl: entry?.audioUrl,
        source,
      }).then((res) => {
        if (!res.success) console.error("[memzo] CAPTURE_WORD failed:", res.error);
        else console.log("[memzo] captured:", word);
      }).catch((e) => console.error("[memzo] sendMessage error:", e));
    } else if (next !== null && !isAuthenticated) {
      console.warn("[memzo] not authenticated, skip capture");
    }
  }


  if (!isWord) return <span>{word}</span>;

  // Determine if this word should be highlighted based on user level
  const inLearningZone = (() => {
    // No level set yet → show all (default behavior)
    if (!userLevel) return true;
    // Already-marked words always show their status color
    if (status !== null) return true;
    const diff = getDifficulty(targetLang);
    if (!diff) return true;
    const wordLevel = diff.getLevel(word);
    return isInLearningZone(wordLevel, userLevel);
  })();

  const boxStyle = getBoxStyle(status, inLearningZone);

  return (
    <span
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "inline-block",
        position: "relative",
        margin: "1px 0",
        padding: "1px 3px",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "inherit",
        lineHeight: "inherit",
        transition: "border-color 0.15s, background 0.15s",
        ...boxStyle,
      }}
    >
      {word}
      {showTooltip && entry !== undefined && (
        <Tooltip
          entry={entry}
          word={word}
          status={status}
          onStatusChange={handleStatusChange}
          onMouseEnter={() => { clearTimeout(showTimerRef.current); clearTimeout(hideTimerRef.current); }}
          onMouseLeave={() => { setShowTooltip(false); globalHideTooltip = null; }}
          nativeLang={nativeLang}
        />
      )}
    </span>
  );
}

function getBoxStyle(status: WordStatus | null, inLearningZone: boolean): React.CSSProperties {
  switch (status) {
    case "learning":
      return {
        border: "1.5px solid rgba(96, 165, 250, 0.85)",
        background: "rgba(59, 130, 246, 0.12)",
        color: "#93c5fd",
      };
    case "mastered":
      return {
        border: "1.5px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.55)",
      };
    default:
      // Only show green highlight for words in the user's learning zone
      if (inLearningZone) {
        return {
          border: "1.5px solid rgba(52, 211, 153, 0.7)",
          background: "rgba(16, 185, 129, 0.08)",
          color: "#fff",
        };
      }
      // Out-of-zone words: no visual noise, still hoverable
      return {
        border: "1.5px solid transparent",
        background: "transparent",
        color: "#fff",
      };
  }
}
