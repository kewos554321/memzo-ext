# Memzo Extension — Specification Index

**Version:** 1.0.0
**Date:** 2026-03-03
**Status:** Current Implementation

## What is Memzo Extension?

Memzo Extension is a Chrome/Firefox browser extension that displays bilingual subtitles
on YouTube and lets users capture vocabulary words in context. Captured words are sent
to the Memzo web app inbox for review and import into study decks.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | WXT 0.20 |
| UI | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Messaging | Chrome Extension Message Passing (MV3) |
| Build | Vite (via WXT) |

## Entrypoints

| Path | Role |
|------|------|
| `src/entrypoints/background/index.ts` | Service worker — message router |
| `src/entrypoints/background/api.ts` | All HTTP calls to memzo-web |
| `src/entrypoints/background/subtitles.ts` | YouTube caption fetcher |
| `src/entrypoints/background/translator.ts` | Google Translate (cached) |
| `src/entrypoints/background/dictionary.ts` | Free Dictionary API (cached) |
| `src/entrypoints/content/index.tsx` | Content script entry, SPA nav watcher |
| `src/entrypoints/content/components/` | SubtitleOverlay, WordSpan, Tooltip, ToolbarPill, SettingsPanel, LevelTestDialog |
| `src/entrypoints/popup/App.tsx` | Extension popup — auth state router |

## Feature Specs

| # | File | Feature | Status |
|---|------|---------|--------|
| 01 | [01-auth.md](./01-auth.md) | Extension login, JWT storage, logout | ✅ Completed |
| 02 | [02-subtitle-overlay.md](./02-subtitle-overlay.md) | Bilingual subtitle overlay on YouTube | ✅ Completed |
| 03 | [03-word-capture.md](./03-word-capture.md) | Word tooltip, dictionary lookup, capture flow | ✅ Completed |
| 04 | [04-level-system.md](./04-level-system.md) | CEFR/HSK placement test & learning zone | ✅ Completed |
| 05 | [05-settings.md](./05-settings.md) | Language preferences & server sync | ✅ Completed |
| 06 | [06-background-messaging.md](./06-background-messaging.md) | Background service worker message router | ✅ Completed |
| 07 | [07-progressive-translation.md](./07-progressive-translation.md) | Progressive translation rendering (per-batch setCues) | ✅ Completed |
| 08 | [08-playback-aware-translation.md](./08-playback-aware-translation.md) | Sliding-window translation driven by playback position | ✅ Completed |

## Message Protocol Summary

All messages from content/popup → background follow:

```ts
// Send
browser.runtime.sendMessage({ type: MessageType, ...payload })

// Response envelope
| { success: true; data: unknown }
| { success: false; error: string }
```

See [06-background-messaging.md](./06-background-messaging.md) for the full message contract table.

## Key Libraries

| Path | Purpose |
|------|---------|
| `src/lib/types.ts` | All shared TypeScript interfaces and message types |
| `src/lib/messages.ts` | `sendMessage()` wrapper |
| `src/lib/constants.ts` | Storage keys, API URL, cache TTL |
| `src/lib/difficulty/` | CEFR (English) + HSK (Chinese) word difficulty engines |
| `src/lib/sources/youtube.ts` | `YoutubeAdapter` — builds `SourceContext` for word capture |
