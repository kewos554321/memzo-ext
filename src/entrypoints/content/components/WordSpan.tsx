import { useState, useRef, useEffect } from "react";
import type { DictionaryEntry, Collection, WordStatus } from "@/lib/types";
import { sendMessage } from "@/lib/messages";
import { STORAGE_KEYS } from "@/lib/constants";
import { Tooltip } from "./Tooltip";

interface WordSpanProps {
  word: string;
  collections: Collection[];
  selectedCollectionId: string | null;
}

// Module-level word status cache shared across all WordSpan instances
let statusMap: Record<string, WordStatus> = {};
let statusLoaded = false;

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

async function saveStatus(word: string, status: WordStatus | null) {
  const key = word.toLowerCase();
  if (status === null) {
    delete statusMap[key];
  } else {
    statusMap[key] = status;
  }
  await storage.setItem(`local:${STORAGE_KEYS.WORD_STATUSES}`, statusMap);
}

export function WordSpan({ word, collections, selectedCollectionId }: WordSpanProps) {
  const [entry, setEntry] = useState<DictionaryEntry | null | undefined>(undefined);
  const [showTooltip, setShowTooltip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<WordStatus | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isWord = /^[a-zA-Z'-]+$/.test(word);

  // Load word status on mount
  useEffect(() => {
    if (!isWord) return;
    loadStatuses().then(() => {
      const s = statusMap[word.toLowerCase()] ?? null;
      setStatus(s);
    });
  }, [word, isWord]);

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
  }

  async function handleSave() {
    if (!selectedCollectionId || saving) return;
    setSaving(true);
    try {
      const back = entry
        ? `${entry.phonetic ? `${entry.phonetic}\n` : ""}${
            entry.meanings[0]?.definitions[0]?.definition || ""
          }`
        : word;
      await sendMessage({
        type: "SAVE_CARD",
        collectionId: selectedCollectionId,
        front: word,
        back,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!isWord) return <span>{word}</span>;

  const boxStyle = getBoxStyle(status);

  return (
    <span
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "inline-block",
        position: "relative",
        margin: "2px 1px",
        padding: "1px 5px",
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
          saving={saving}
          canSave={!!selectedCollectionId}
          onStatusChange={handleStatusChange}
          onSave={handleSave}
          onMouseEnter={() => { clearTimeout(showTimerRef.current); clearTimeout(hideTimerRef.current); }}
          onMouseLeave={() => { setShowTooltip(false); globalHideTooltip = null; }}
        />
      )}
    </span>
  );
}

function getBoxStyle(status: WordStatus | null): React.CSSProperties {
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
      return {
        border: "1.5px solid rgba(52, 211, 153, 0.7)",
        background: "rgba(16, 185, 129, 0.08)",
        color: "#fff",
      };
  }
}
