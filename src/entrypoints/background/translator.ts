import { TRANSLATE_BATCH_SIZE, STORAGE_KEYS, CACHE_TTL } from "@/lib/constants";

interface TranslateResult {
  sentences: { trans: string }[];
}

async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  const query = texts.map((t) => `q=${encodeURIComponent(t)}`).join("&");
  const url = `https://translate.googleapis.com/translate_a/t?client=gtx&sl=${sourceLang}&tl=${targetLang}&${query}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);

  const data = await res.json();

  // Response format varies: single text returns [[trans, src]], multiple returns [[[trans, src]], ...]
  if (texts.length === 1) {
    return [Array.isArray(data[0]) ? data[0][0] : data[0]];
  }
  return data.map((item: string[] | string[][]) =>
    Array.isArray(item[0]) ? item[0][0] : item[0]
  );
}

export async function translateTexts(
  texts: string[],
  videoId: string,
  targetLang: string = "zh-TW"
): Promise<string[]> {
  const cacheKey = `local:${STORAGE_KEYS.SUBTITLE_CACHE_PREFIX}${videoId}:${targetLang}`;

  // Check cache
  const cached = await storage.getItem<{
    translations: string[];
    timestamp: number;
  }>(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (cached.translations.length === texts.length) {
      return cached.translations;
    }
  }

  // Translate in batches
  const results: string[] = [];
  for (let i = 0; i < texts.length; i += TRANSLATE_BATCH_SIZE) {
    const batch = texts.slice(i, i + TRANSLATE_BATCH_SIZE);
    const translated = await translateBatch(batch, "en", targetLang);
    results.push(...translated);
  }

  // Cache results
  await storage.setItem(cacheKey, {
    translations: results,
    timestamp: Date.now(),
  });

  return results;
}
