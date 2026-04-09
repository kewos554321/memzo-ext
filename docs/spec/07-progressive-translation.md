# Progressive Translation Rendering

**Version:** 1.0.0
**Status:** Draft
**Spec file:** docs/spec/07-progressive-translation.md

## Overview

Currently, `useSubtitles` waits for all translation batches to finish before calling `setCues`, so the user sees no translations until the slowest batch resolves. This spec changes the rendering model so that translations appear as each batch completes — the first 50 cues display translations almost immediately, with remaining cues filling in progressively.

## User Stories

- As a viewer, I want to see translations for the first few subtitles within ~1 second of the overlay loading, rather than waiting for all subtitles to be translated.

## Current Flow

```
FETCH_SUBTITLES → mergeCues → setCues(english only)
                → translateBatch(0..49)  ─┐
                → translateBatch(50..99) ─┼── Promise.all → single setCues(with translations)
                → translateBatch(100..)  ─┘
```

## Target Flow

```
FETCH_SUBTITLES → mergeCues → setCues(english only)
                → translateBatch(0..49)  ── resolves → setCues(patch batch 0)
                → translateBatch(50..99) ── resolves → setCues(patch batch 1)
                → translateBatch(100..)  ── resolves → setCues(patch batch 2)
```

Each batch patches only its own slice of the cues array. Batches still fire in parallel — only the state update is decoupled from the others.

## Acceptance Criteria

- [ ] Translations for cues 0–49 appear as soon as the first batch resolves, without waiting for later batches.
- [ ] Each subsequent batch patches its own slice of cues independently.
- [ ] Cues that have not yet been translated continue to show only the English text (no regression).
- [ ] Cache behavior is unchanged: a cache hit still returns all translations instantly.
- [ ] No new dependencies introduced.

## Implementation Notes

### File to change: `src/entrypoints/content/hooks/useSubtitles.ts`

Replace the current block (lines 46–61):

```ts
// OLD — waits for all batches
const texts = merged.map((c) => c.text);
const transRes = await sendMessage({ type: "TRANSLATE", texts, videoId, lang: nativeLang });
if (transRes.success) {
  const translations = transRes.data as string[];
  merged.forEach((cue, i) => { cue.translation = translations[i]; });
  setCues([...merged]);
}
```

With a per-batch approach:

```ts
// NEW — update cues as each batch resolves
const BATCH = TRANSLATE_BATCH_SIZE; // 50
const texts = merged.map((c) => c.text);
const batches: { start: number; texts: string[] }[] = [];
for (let i = 0; i < texts.length; i += BATCH) {
  batches.push({ start: i, texts: texts.slice(i, i + BATCH) });
}

// Working copy shared across batch callbacks
const working = [...merged];

await Promise.all(
  batches.map(async ({ start, texts: batchTexts }) => {
    const res = await sendMessage({
      type: "TRANSLATE",
      texts: batchTexts,
      videoId,
      lang: nativeLang,
    });
    if (res.success) {
      const translations = res.data as string[];
      translations.forEach((t, j) => { working[start + j].translation = t; });
      setCues([...working]);
    }
  })
);
```

> Note: `TRANSLATE_BATCH_SIZE` is imported from `@/lib/constants`. The background `TRANSLATE` handler already accepts an arbitrary `texts` array — no backend changes needed.

## Out of Scope

- Prioritising cues near the current playback position (deferred to a future spec).
- Switching translation providers.
- Changing batch size.
