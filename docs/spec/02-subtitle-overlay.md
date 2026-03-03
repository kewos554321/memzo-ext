# Subtitle Overlay — Bilingual Caption Display on YouTube

**Version:** 1.0.0
**Status:** Completed
**Spec file:** docs/spec/02-subtitle-overlay.md

## Overview

When a user visits a YouTube video page, the extension injects a bilingual subtitle overlay
above the native player controls. The overlay shows the current English subtitle line with
each word individually hoverable, plus a translated line in the user's native language.
The overlay is toggled via the toolbar pill injected into YouTube's player controls.

## User Stories

- As a user, I want to see English subtitles word-by-word so that I can interact with individual words.
- As a user, I want to see my native language translation beneath the English subtitle so that I understand the meaning.
- As a user, I want to toggle the overlay on/off without leaving YouTube so that I can watch normally when not studying.
- As the system, I want to hide YouTube's native CC when the overlay is active so that captions don't double-render.

## Message Flow

| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| content → background | `FETCH_SUBTITLES` | `{ url: string; videoId: string }` | `subtitles.ts` |
| content → background | `TRANSLATE` | `{ texts: string[]; videoId: string; lang: string }` | `translator.ts` |
| page world → content | `memzo:toggle` | CustomEvent (no payload) | `index.tsx` |
| page world → content | `memzo:cc-enable` | CustomEvent | `index.tsx` |
| page world → content | `memzo:cc-disable` | CustomEvent | `index.tsx` |
| content → page world | via `dataset.memzoCaptionTracks` | JSON string | injected page script |

## Caption Pipeline (useCaptionMirror)

### Source 1 — Pre-fetched sentences (preferred)
1. Page-injected script hooks `window.fetch` + `ytInitialPlayerResponse` to capture caption track URLs
2. Stores JSON in `document.documentElement.dataset.memzoCaptionTracks`
3. `useSubtitles` reads tracks, picks English, sends `FETCH_SUBTITLES` to background
4. Background fetches YouTube timedtext API (`fmt=json3`), parses cues
5. Short cues merged into sentence-level groups (split on `.!?` or >2s gap)
6. `TRANSLATE` sent in background; cues updated when translations arrive
7. `useVideoTime` (rAF, throttled 100ms) binary-searches merged cues by current time

### Source 2 — DOM polling fallback
- Polls `.ytp-caption-window-container` every 150ms
- Reads `.ytp-caption-segment` text
- Debounces display 300ms to avoid word-by-word flicker
- Auto-translates via `TRANSLATE` message; uses shared `translationCache`

## UI/UX Notes

**SubtitleOverlay (Shadow DOM, position: absolute)**
- Mounted at bottom: 80px, left: 50%, transform: translateX(-50%)
- Hidden until toolbar pill toggles it on
- Dark background, yellow English text, backdrop blur
- Each word wrapped in `<WordSpan>` (spaces excluded)
- Native translation line below (shows "翻譯中..." while pending)

**ToolbarPill (injected into `.ytp-right-controls`)**
- Toggle button: green dot "開啟" / gray dot "關閉"
- Settings gear → opens `SettingsPanel`
- Uses YouTube native button styling (transparent, white, Roboto font)

**YouTube CC suppression**
- Injected CSS: `.ytp-caption-window-container { opacity: 0; pointer-events: none }`
- Enabled only while overlay is active

## Acceptance Criteria

- [x] Overlay mounts in Shadow DOM on YouTube video pages
- [x] Caption tracks extracted via page-injected script hook
- [x] Subtitle cues fetched and merged into sentence-level groups
- [x] Current subtitle determined by video playback time (binary search)
- [x] DOM polling fallback activates when pre-fetched cues unavailable
- [x] Native language translation displayed beneath English line
- [x] Toggle via ToolbarPill shows/hides overlay
- [x] YouTube native CC hidden while overlay is active
- [x] Overlay tears down and remounts on YouTube SPA navigation

## Out of Scope

- Non-English source subtitle tracks (always fetches English)
- Subtitle track language selection UI
- Offline subtitle caching beyond current session
