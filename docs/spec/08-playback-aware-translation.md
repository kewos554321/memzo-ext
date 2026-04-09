# Playback-Aware Progressive Translation

**Version:** 1.0.0
**Status:** ✅ Completed
**Spec file:** docs/spec/08-playback-aware-translation.md

## Overview

Currently `useSubtitles` translates all cues for the entire video upfront. For a 30-minute
video this can mean 300+ translation requests before the user even sees the first subtitle.
This spec changes the translation strategy to a sliding window driven by the current playback
position: only cues near `currentTime` are translated, and the window advances as the video
plays. The result is near-zero translation latency at any playback position, including after
seeking.

## User Stories

- As a viewer, I want translations to appear immediately when a subtitle is shown, regardless
  of where in the video I am (beginning, middle, or after seeking).
- As a viewer starting in the middle of a video, I do not want to wait for all prior subtitles
  to be translated before I see translations.

## Architecture

### Current Flow

```
useSubtitles:
  FETCH_SUBTITLES → mergeCues → setCues(english)
                 → translate ALL cues in parallel batches → setCues(with translations)

useCaptionMirror:
  cues + currentTime → look up active cue → display text + translation
```

### Target Flow

```
useSubtitles:
  FETCH_SUBTITLES → mergeCues → setCues(english only, no translation)

useCaptionMirror:
  cues + currentTime → look up active cue idx
                     → if window has moved: translateWindow(idx, idx+WINDOW_SIZE)
                     → patch cues[idx..idx+WINDOW_SIZE].translation → setCues
                     → display text + translation
```

Translation is owned by `useCaptionMirror` because it is the only place where both
`cues` and `currentTime` are available simultaneously.

## Constants

| Name | Value | Rationale |
|------|-------|-----------|
| `TRANSLATION_WINDOW` | 25 cues | ~2–4 min of video; covers a seek buffer |
| `WINDOW_ADVANCE_THRESHOLD` | 10 cues | Re-trigger when within 10 cues of window end |

## Message Flow

No new message types. Uses the existing `TRANSLATE` message (already accepts an array
of texts).

| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| content → background | `TRANSLATE` | `{ texts: string[], videoId: string, lang: string }` | `background/translator.ts` |

## Implementation Plan

### Step 1 — Strip translation from `useSubtitles`

File: `src/entrypoints/content/hooks/useSubtitles.ts`

Remove the entire translation block (lines 46–72). After `mergeCuesIntoSentences`, call
`setCues(merged)` immediately and return. `useSubtitles` now only fetches and merges cues.

### Step 2 — Add `useTranslationWindow` hook

File: `src/entrypoints/content/hooks/useTranslationWindow.ts` *(new file)*

```ts
export function useTranslationWindow(
  cues: SubtitleCue[],
  setCues: (cues: SubtitleCue[]) => void,
  currentIdx: number,
  videoId: string,
  lang: string
): void
```

Responsibilities:
- Track `windowStart` ref (the cue index where the current translation window begins).
- Trigger a new translation window when `currentIdx >= windowStart + WINDOW_ADVANCE_THRESHOLD`.
- Send one `TRANSLATE` message for `cues[windowStart..windowStart+WINDOW_SIZE]` that are not
  yet translated (`cue.translation === undefined`).
- On response, patch only those cues and call `setCues([...updated])`.
- On seek (large `currentIdx` jump, i.e. `|currentIdx - prevIdx| > WINDOW_SIZE`), reset
  `windowStart` to `currentIdx` and trigger immediately.

### Step 3 — Wire into `useCaptionMirror`

File: `src/entrypoints/content/hooks/useCaptionMirror.ts`

- Lift `cues` state up: change from `const { cues } = useSubtitles(...)` to
  `const [cues, setCues] = useState<SubtitleCue[]>([]); useSubtitles(videoId, nativeLang, setCues)`.
- After `findCueIndex(currentTime)`, call `useTranslationWindow(cues, setCues, idx, videoId, nativeLang)`.

> Alternative: keep `cues` inside `useSubtitles` but expose a `patchCues` callback.
> The lifted-state approach is cleaner because `useCaptionMirror` already owns the display logic.

## Acceptance Criteria

- [ ] Subtitles at the start of a video show translations within ~1 second of overlay load.
- [ ] After seeking to the middle or end of a video, translations appear within ~1 second for the new position.
- [ ] Only cues within the current window are ever translated (verify by counting TRANSLATE messages in background).
- [ ] Cues outside the window show English text only — no blank/broken state.
- [ ] Cache behavior is unchanged: a full cache hit still returns translations instantly.
- [ ] DOM caption fallback path is unaffected.

## Out of Scope

- Backward pre-fetch (translating behind the current position).
- Changing the translation provider.
- Sentence boundary improvements (see future spec).
