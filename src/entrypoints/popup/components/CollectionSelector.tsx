import { useState } from "react";
import type { Collection } from "@/lib/types";

interface CollectionSelectorProps {
  collections: Collection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string) => void;
}

export function CollectionSelector({
  collections,
  selectedId,
  onSelect,
  onCreate,
}: CollectionSelectorProps) {
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
            Select a collection...
          </option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.cards.length} cards)
            </option>
          ))}
        </select>
      </div>

      {showNew ? (
        <div className="new-collection-row">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New collection name"
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
          + New collection
        </button>
      )}
    </div>
  );
}
