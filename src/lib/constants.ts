export const MEMZO_API_URL =
  import.meta.env.VITE_MEMZO_API_URL || "http://localhost:3000";

export const STORAGE_KEYS = {
  TOKEN: "memzo_token",
  USER: "memzo_user",
  SELECTED_DECK: "memzo_selected_deck",
  RECENT_WORDS: "memzo_recent_words",
  SUBTITLE_CACHE_PREFIX: "sub_cache_",
  WORD_STATUSES: "word_statuses",
  NATIVE_LANG: "memzo_native_lang",
  TARGET_LANG: "memzo_target_lang",
  // Per-language level key: append the LanguageCode, e.g. "memzo_user_level_en"
  USER_LEVEL_PREFIX: "memzo_user_level_",
} as const;

export const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
export const TRANSLATE_BATCH_SIZE = 50;
