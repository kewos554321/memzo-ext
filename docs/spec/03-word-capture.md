# Word Capture — Tooltip, Dictionary & Save Flow

**Version:** 1.0.0
**Status:** Completed
**Spec file:** docs/spec/03-word-capture.md

## Overview

When a user hovers over any word in the subtitle overlay, a tooltip appears showing the
word's phonetic, audio pronunciation, and dictionary meanings. The user can mark the word
as "學習中" (learning) or "已掌握" (mastered). Marking a word sends it to the Memzo API
as a `CapturedWord` with full YouTube context metadata. Word statuses are persisted locally
and synced to the server.

## User Stories

- As a user, I want to hover over a subtitle word and see its definition so that I can understand it in context.
- As a user, I want to hear the pronunciation of a word so that I learn how to say it correctly.
- As a user, I want to mark a word as "learning" so that it's saved to my Memzo inbox.
- As a user, I want to mark a word as "mastered" so that it's recorded but won't be prioritized in study.
- As a user, I want to see definitions translated to my native language so that I understand them better.
- As the system, I want to color-code words by status so that the user can see their vocabulary at a glance.

## Message Flow

| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| content → background | `LOOKUP_WORD` | `{ word: string }` | `dictionary.ts` |
| content → background | `TRANSLATE` | `{ texts: string[]; videoId: string; lang: string }` | `translator.ts` |
| content → background | `CAPTURE_WORD` | `{ word, definition, phonetic?, audioUrl?, source: SourceContext }` | `background/index.ts` |
| content → background | `GET_VOCAB_WORDS` | — | `background/index.ts` |

### API Calls (background/api.ts)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/words` | — | `string[]` (list of captured words) |
| POST | `/api/words/capture` | `{ word, definition, phonetic, audioUrl, source }` | — |

### Storage Keys

| Key | Value |
|-----|-------|
| `word_statuses` | `Record<string, WordStatus>` (`"learning"` \| `"mastered"`) |
| `memzo_recent_words` | Last 50 captured words (array) |

## Source Context (YoutubeAdapter)

```ts
{
  type: "youtube",
  url: location.href,
  videoId: searchParams.get("v"),
  title: document.title.replace(" - YouTube", ""),
  timestamp: video.currentTime,   // seconds
  context: currentSubtitle,       // full subtitle line
  highlightWord: targetWord,      // the clicked word
}
```

## Word Color Coding (WordSpan)

| Status | Condition | Visual |
|--------|-----------|--------|
| `learning` | Marked by user | Blue highlight |
| `mastered` | Marked by user | Dimmed white |
| Untagged, in learning zone | Word level ≈ user CEFR level | Green highlight |
| Untagged, out of zone | Word too easy or too hard | Transparent (no style) |

## UI/UX Notes

**WordSpan**
- Hover triggers `LOOKUP_WORD` after 200ms debounce
- Tooltip appears anchored at `bottom: calc(100% + 10px), left: 50%`
- Each word remembers its `WordStatus` from `statusMap` (module-level singleton)

**Tooltip**
- Dark background (`#18181b`), white text
- Min-width 220px, max-width 300px
- Box shadow + subtle border + z-index 999999
- Arrow pointer (45° rotated square)
- Displays: word, phonetic, audio button (plays `entry.audioUrl`)
- Up to 3 meanings with POS abbreviations + definitions
- Definitions auto-translated to native language
- Status buttons: "🔵 學習中" / "✅ 已掌握"

## Acceptance Criteria

- [x] Hovering a word for 200ms triggers `LOOKUP_WORD`
- [x] Dictionary result cached in memory for background lifetime
- [x] Tooltip renders phonetic, audio, and up to 3 meanings
- [x] Audio plays on button click
- [x] Definitions translated to native language via `TRANSLATE`
- [x] Clicking "學習中" sends `CAPTURE_WORD` with full YouTube context
- [x] Word status saved to `word_statuses` in local storage
- [x] `syncVocabStatus` marks previously captured words as "learning" on load
- [x] Word coloring reflects current status and learning zone

## Out of Scope

- Saving directly to a specific deck from the tooltip (goes to inbox only)
- Editing the definition before saving
- Offline dictionary fallback
