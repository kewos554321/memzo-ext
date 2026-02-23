import { useState, useRef } from "react";
import type { DictionaryEntry, Collection } from "@/lib/types";
import { sendMessage } from "@/lib/messages";
import { Tooltip } from "./Tooltip";

interface WordSpanProps {
  word: string;
  collections: Collection[];
  selectedCollectionId: string | null;
}

export function WordSpan({ word, collections, selectedCollectionId }: WordSpanProps) {
  const [entry, setEntry] = useState<DictionaryEntry | null | undefined>(
    undefined
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Only look up actual words (not punctuation/numbers)
  const isWord = /^[a-zA-Z'-]+$/.test(word);

  async function handleMouseEnter() {
    if (!isWord) return;
    clearTimeout(timeoutRef.current);
    setShowTooltip(true);

    if (entry === undefined) {
      const res = await sendMessage({ type: "LOOKUP_WORD", word });
      if (res.success) {
        setEntry(res.data as DictionaryEntry | null);
      }
    }
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 200);
  }

  async function handleSave(translation: string) {
    if (!selectedCollectionId || saving) return;
    setSaving(true);
    try {
      const back = entry
        ? `${entry.phonetic ? `${entry.phonetic}\n` : ""}${entry.meanings[0]?.definitions[0]?.definition || ""}\n\n${translation}`
        : translation;

      await sendMessage({
        type: "SAVE_CARD",
        collectionId: selectedCollectionId,
        front: word,
        back,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <span
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: isWord ? "pointer" : "default",
        borderBottom: isWord ? "1px dotted rgba(255,255,255,0.4)" : "none",
        position: "relative",
      }}
    >
      {word}
      {showTooltip && entry !== undefined && (
        <Tooltip
          entry={entry}
          word={word}
          saving={saving}
          saved={saved}
          canSave={!!selectedCollectionId}
          onSave={handleSave}
          onMouseEnter={() => clearTimeout(timeoutRef.current)}
          onMouseLeave={() => setShowTooltip(false)}
        />
      )}
    </span>
  );
}
