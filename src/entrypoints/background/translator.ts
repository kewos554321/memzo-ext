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
  targetLang: string = "en"
): Promise<string[]> {
  const cacheKey = `local:${STORAGE_KEYS.SUBTITLE_CACHE_PREFIX}${videoId}:${targetLang}`;

  // Check cache — must match both count AND source texts
  const cached = await storage.getItem<{
    texts: string[];
    translations: string[];
    timestamp: number;
  }>(cacheKey);
  if (
    cached &&
    Date.now() - cached.timestamp < CACHE_TTL &&
    cached.texts?.length === texts.length &&
    cached.texts.every((t, i) => t === texts[i])
  ) {
    return cached.translations;
  }

  // Split into batches and translate all in parallel
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += TRANSLATE_BATCH_SIZE) {
    batches.push(texts.slice(i, i + TRANSLATE_BATCH_SIZE));
  }
  const batchResults = await Promise.all(
    batches.map((batch) => translateBatch(batch, "auto", targetLang))
  );
  const results = batchResults.flat();

  // Cache results with source texts for proper invalidation
  await storage.setItem(cacheKey, {
    texts,
    translations: results,
    timestamp: Date.now(),
  });

  return results;
}
