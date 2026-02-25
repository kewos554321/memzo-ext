import { useState } from "react";
import type { Deck } from "@/lib/types";

interface DeckSelectorProps {
  decks: Deck[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string) => void;
}

export function DeckSelector({
  decks,
  selectedId,
  onSelect,
  onCreate,
}: DeckSelectorProps) {
  const [newTitle, setNewTitle] = useState("");
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="section">
      <div className="section-title">Save words to</div>
      <div className="form-group">
        <select
          value={selectedId || ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="" disabled>
            Select a deck...
          </option>
          {decks.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.cards.length} cards)
            </option>
          ))}
        </select>
      </div>

      {showNew ? (
        <div className="new-deck-row">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New deck name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                onCreate(newTitle.trim());
                setNewTitle("");
                setShowNew(false);
              }
            }}
          />
          <button
            onClick={() => {
              if (newTitle.trim()) {
                onCreate(newTitle.trim());
                setNewTitle("");
                setShowNew(false);
              }
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          className="btn-ghost"
          onClick={() => setShowNew(true)}
          style={{ color: "#a6e3a1" }}
        >
          + New deck
        </button>
      )}
    </div>
  );
}
