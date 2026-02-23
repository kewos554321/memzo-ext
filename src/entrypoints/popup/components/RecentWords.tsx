import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

interface RecentWord {
  front: string;
  back: string;
  savedAt: number;
}

export function RecentWords() {
  const [words, setWords] = useState<RecentWord[]>([]);

  useEffect(() => {
    storage
      .getItem<RecentWord[]>(`local:${STORAGE_KEYS.RECENT_WORDS}`)
      .then((saved) => {
        if (saved) setWords(saved.slice(0, 10));
      });
  }, []);

  if (words.length === 0) return null;

  return (
    <div className="section">
      <div className="section-title">Recent words</div>
      <ul className="word-list">
        {words.map((w, i) => (
          <li key={i}>
            <span className="word-front">{w.front}</span>
            <span className="word-back">{w.back}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
