export const MEMZO_API_URL =
  import.meta.env.VITE_MEMZO_API_URL || "http://localhost:3000";

export const STORAGE_KEYS = {
  TOKEN: "memzo_token",
  USER: "memzo_user",
  SELECTED_COLLECTION: "memzo_selected_collection",
  RECENT_WORDS: "memzo_recent_words",
  SUBTITLE_CACHE_PREFIX: "sub_cache_",
} as const;

export const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
export const TRANSLATE_BATCH_SIZE = 50;
