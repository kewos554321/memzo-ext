import type { CEFRLevel, LanguageCode } from "../types";
import { EN_DIFFICULTY } from "./en";
import { ZH_TW_DIFFICULTY } from "./zh-TW";

// ── LangDifficulty interface ─────────────────────────────────────────────────
// Each language implements this to provide CEFR-mapped difficulty data.
// To add a new language: create src/lib/difficulty/{lang-code}.ts,
// implement LangDifficulty, and register it in REGISTRY below.

export interface LangDifficulty {
  /** Map a single word/character to its CEFR tier */
  getLevel(word: string): CEFRLevel;
  /** 8 representative words per CEFR tier, used in placement test */
  placementWords: Record<CEFRLevel, string[]>;
  /** Human-readable label for a level in this language's system */
  levelLabel(level: CEFRLevel): string;
  /** Name of the grading system (shown in UI) */
  systemName: string; // e.g. "CEFR" | "HSK"
}

// ── Registry ─────────────────────────────────────────────────────────────────
const REGISTRY: Partial<Record<LanguageCode, LangDifficulty>> = {
  en: EN_DIFFICULTY,
  "zh-TW": ZH_TW_DIFFICULTY,
};

export function getDifficulty(lang: LanguageCode): LangDifficulty | null {
  return REGISTRY[lang] ?? null;
}

// ── CEFR level ordering ──────────────────────────────────────────────────────
export const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function isInLearningZone(wordLevel: CEFRLevel, userLevel: CEFRLevel): boolean {
  const userIdx = CEFR_LEVELS.indexOf(userLevel);
  const wordIdx = CEFR_LEVELS.indexOf(wordLevel);
  // Show: at user's current level + one above (challenging but achievable)
  return wordIdx >= userIdx && wordIdx <= userIdx + 1;
}
