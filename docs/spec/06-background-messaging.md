# Background Messaging — Service Worker Message Router

**Version:** 1.0.0
**Status:** Completed
**Spec file:** docs/spec/06-background-messaging.md

## Overview

The background service worker (`background/index.ts`) is the single message router for
all communication between content scripts, the popup, and external APIs. It handles 12
message types via a `switch` statement on `message.type`. All external HTTP calls are
centralized in `background/api.ts` and use a shared `authFetch` wrapper that attaches
the JWT token and handles 401 auto-logout.

## User Stories

- As the system, I want all API calls routed through the background so that the JWT token is managed in one place.
- As the system, I want content scripts isolated from HTTP logic so that they only send typed messages.

## Complete Message Contract

| Message Type | Payload | Returns | Handler |
|-------------|---------|---------|---------|
| `FETCH_SUBTITLES` | `{ url: string; videoId: string }` | `SubtitleCue[]` | `subtitles.ts` |
| `TRANSLATE` | `{ texts: string[]; videoId: string; lang: string }` | `string[]` | `translator.ts` |
| `LOOKUP_WORD` | `{ word: string }` | `DictionaryEntry \| null` | `dictionary.ts` |
| `GET_VOCAB_WORDS` | — | `string[]` | `api.ts → GET /api/words` |
| `CAPTURE_WORD` | `{ word, definition, phonetic?, audioUrl?, source }` | — | `api.ts → POST /api/words/capture` |
| `SAVE_CARD` | `{ deckId, front, back }` | — | `api.ts → POST /api/ext/decks/{id}/cards` |
| `GET_DECKS` | — | `Deck[]` | `api.ts → GET /api/ext/decks` |
| `CREATE_DECK` | `{ title: string }` | `Deck` | `api.ts → POST /api/ext/decks` |
| `GET_AUTH_STATE` | — | `{ user, token }` | `api.ts → storage read` |
| `LOGIN` | `{ email: string; password: string }` | `{ token, user }` | `api.ts → POST /api/ext/auth/token` |
| `LOGOUT` | — | — | `api.ts → clears storage` |
| `GET_SETTINGS` | — | `{ nativeLang, targetLang, userLevels? }` | `api.ts → GET /api/ext/settings` |
| `SAVE_SETTINGS` | `{ nativeLang?, targetLang?, userLevels? }` | — | `api.ts → PATCH /api/ext/settings` |

## Response Envelope

All responses follow:
```ts
| { success: true; data: unknown }
| { success: false; error: string }
```

## authFetch Behavior

1. Reads JWT from `browser.storage.local` (`memzo_token`)
2. Attaches `Authorization: Bearer {token}` header
3. On 401 response: removes token from storage (auto-logout)
4. Throws on non-OK responses (caller catches and returns `{ success: false }`)

## External Services (background only)

| Service | URL | Used by |
|---------|-----|---------|
| Memzo Web API | `VITE_MEMZO_API_URL` (default: `http://localhost:3000`) | `api.ts` |
| Google Translate | `translate.googleapis.com` | `translator.ts` |
| Free Dictionary | `api.dictionaryapi.dev/api/v2/entries/en/{word}` | `dictionary.ts` |
| YouTube Timedtext | `www.youtube.com/api/timedtext` | `subtitles.ts` |

## Acceptance Criteria

- [x] `browser.runtime.onMessage` handles all 12 message types
- [x] Unrecognized message types return `{ success: false, error: "Unknown message type" }`
- [x] All HTTP calls use `authFetch` (token attached automatically)
- [x] 401 auto-clears token from storage
- [x] `sendMessage` helper in `lib/messages.ts` wraps `browser.runtime.sendMessage`
- [x] Background responds synchronously via `sendResponse` (returns `true` to keep channel open for async)

## Out of Scope

- Background-to-content push messages (currently poll-based)
- Persistent background (MV3 service worker sleeps when idle)
- Message queuing / retry on service worker wake
