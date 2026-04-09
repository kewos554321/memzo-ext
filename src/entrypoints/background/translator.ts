import { TRANSLATE_BATCH_SIZE, STORAGE_KEYS, CACHE_TTL } from "@/lib/constants";

async function translateBatchGoogle(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  const query = texts.map((t) => `q=${encodeURIComponent(t)}`).join("&");
  const url = `https://translate.googleapis.com/translate_a/t?client=gtx&sl=${sourceLang}&tl=${targetLang}&${query}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`Google API failed: ${res.status}`);

  const data = await res.json();

  // Response format varies: single text returns [[trans, src]], multiple returns [[[trans, src]], ...]
  if (texts.length === 1) {
    return [Array.isArray(data[0]) ? data[0][0] : data[0]];
  }
  return data.map((item: string[] | string[][]) =>
    Array.isArray(item[0]) ? item[0][0] : item[0]
  );
}

// 备选翻译源：简单的备选方案（可扩展为真实API）
async function translateBatchFallback(
  texts: string[],
  _sourceLang: string,
  _targetLang: string
): Promise<string[]> {
  // 作为备选，返回原文（避免完全失败）
  // 生产环境可以集成DeepL或其他API
  throw new Error("Fallback not configured");
}

// 竞争式翻译：主API + 备选，谁快用谁
async function translateBatchWithFallback(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  try {
    // 主策略：Google API
    return await translateBatchGoogle(texts, sourceLang, targetLang);
  } catch (primaryErr) {
    console.warn("[translator] Google API failed, trying fallback:", primaryErr);
    try {
      // 如果Google失败，尝试备选
      return await translateBatchFallback(texts, sourceLang, targetLang);
    } catch (fallbackErr) {
      console.error("[translator] All strategies failed:", fallbackErr);
      // 最终降级：返回原文，避免完全中断
      console.warn("[translator] Returning original texts as fallback");
      return texts;
    }
  }
}

export async function translateTexts(
  texts: string[],
  videoId: string,
  targetLang: string = "en"
): Promise<string[]> {
  if (texts.length === 0) return [];

  const cacheKey = `local:${STORAGE_KEYS.SUBTITLE_CACHE_PREFIX}${videoId}:${targetLang}`;

  // 单个文本查询缓存
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
    console.log(`[translator] Cache hit for ${texts.length} texts`);
    return cached.translations;
  }

  // 分小批处理（20条）以加快响应
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += TRANSLATE_BATCH_SIZE) {
    batches.push(texts.slice(i, i + TRANSLATE_BATCH_SIZE));
  }

  console.log(
    `[translator] Translating ${texts.length} texts in ${batches.length} batches`
  );

  const batchResults = await Promise.all(
    batches.map((batch) => translateBatchWithFallback(batch, "auto", targetLang))
  );
  const results = batchResults.flat();

  // 缓存结果
  await storage.setItem(cacheKey, {
    texts,
    translations: results,
    timestamp: Date.now(),
  });

  return results;
}
