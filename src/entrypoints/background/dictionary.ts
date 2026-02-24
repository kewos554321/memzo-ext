import type { DictionaryEntry } from "@/lib/types";

const cache = new Map<string, DictionaryEntry | null>();

export async function lookupWord(
  word: string
): Promise<DictionaryEntry | null> {
  const normalized = word.toLowerCase().trim();
  if (cache.has(normalized)) return cache.get(normalized)!;

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`
    );
    if (!res.ok) {
      cache.set(normalized, null);
      return null;
    }

    const data = await res.json();
    const entry = data[0];

    const audioPhonetic = entry.phonetics?.find(
      (p: { text?: string; audio?: string }) => p.audio
    );
    const result: DictionaryEntry = {
      word: entry.word,
      phonetic:
        entry.phonetic ||
        entry.phonetics?.find((p: { text?: string }) => p.text)?.text,
      audioUrl: audioPhonetic?.audio || undefined,
      meanings: entry.meanings.map(
        (m: {
          partOfSpeech: string;
          definitions: { definition: string; example?: string }[];
        }) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions.slice(0, 2).map((d) => ({
            definition: d.definition,
            example: d.example,
          })),
        })
      ),
    };

    cache.set(normalized, result);
    return result;
  } catch {
    cache.set(normalized, null);
    return null;
  }
}
