import type { CEFRLevel, LanguageCode } from "../types";
import { STORAGE_KEYS } from "../constants";
import { sendMessage } from "../messages";

export function levelKey(lang: LanguageCode): string {
  return `local:${STORAGE_KEYS.USER_LEVEL_PREFIX}${lang}`;
}

export async function saveLevel(lang: LanguageCode, level: CEFRLevel): Promise<void> {
  // 1. Save locally (immediate, used by content script on next render)
  await storage.setItem(levelKey(lang), level);
  // 2. Persist to server DB (fire & forget — failure is acceptable)
  sendMessage({ type: "SAVE_SETTINGS", userLevels: { [lang]: level } }).catch(() => {});
}

export async function loadLevel(lang: LanguageCode): Promise<CEFRLevel | null> {
  return storage.getItem<CEFRLevel>(levelKey(lang));
}
