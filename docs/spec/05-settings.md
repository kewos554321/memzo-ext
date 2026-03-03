# Settings — Language Preferences & Sync

**Version:** 1.0.0
**Status:** Completed
**Spec file:** docs/spec/05-settings.md

## Overview

Users configure their native language and target (learning) language via the SettingsPanel
in the YouTube player. Settings are stored locally for instant access and synced to the
server so they persist across devices. Language changes are broadcast via a custom event
so all active content script components re-render with the new locale.

## User Stories

- As a user, I want to set my native language so that dictionary definitions and tooltip translations appear in my language.
- As a user, I want to set my target language so that the extension knows which language I'm studying.
- As a user, I want my settings to sync to the server so that they carry over when I use a different browser.

## Message Flow

| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| content → background | `GET_SETTINGS` | — | `background/index.ts` |
| content → background | `SAVE_SETTINGS` | `{ nativeLang?, targetLang?, userLevels? }` | `background/index.ts` |
| content → content | `memzo:lang-changed` | CustomEvent (no payload) | `useLanguageSettings` |

### API Calls (background/api.ts)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/ext/settings` | — | `{ nativeLang, targetLang, userLevels? }` |
| PATCH | `/api/ext/settings` | `{ nativeLang?, targetLang?, userLevels? }` | — |

### Storage Keys

| Key | Value | Default |
|-----|-------|---------|
| `memzo_native_lang` | `LanguageCode` | `"zh-TW"` |
| `memzo_target_lang` | `LanguageCode` | `"en"` |
| `memzo_user_level_{lang}` | `CEFRLevel` | `null` |

## useLanguageSettings Hook

Load order (server wins):
1. Local storage → instant render with fallback values
2. `GET_SETTINGS` → server is source of truth; overwrites local if different
3. Per-language user levels synced from server `userLevels` map

Re-sync triggers:
- `visibilitychange` (tab regains focus)
- `memzo:lang-changed` custom event

## UI/UX Notes

**SettingsPanel (content script overlay)**
- Opened via gear icon on ToolbarPill
- Modal overlay (z-index: 2147483645)
- Section 1 — 🌐 Native Language: select (`zh-TW`, `en`)
- Section 2 — 🎯 Target Language: select (`zh-TW`, `en`)
- Section 3 — 📊 Learning Level: read-only + "重新測試" button
- Advanced settings link → opens `memzo.vercel.app/settings` in new tab
- "Done" button: saves to local storage + sends `SAVE_SETTINGS` + dispatches `memzo:lang-changed`

## Acceptance Criteria

- [x] `GET_SETTINGS` fetched on content script mount
- [x] Server settings overwrite local values (server is source of truth)
- [x] `userLevels` from server synced to `memzo_user_level_{lang}` in local storage
- [x] `memzo:lang-changed` dispatched after settings save
- [x] All components re-read settings on `memzo:lang-changed` event
- [x] Settings re-synced from server on tab `visibilitychange`
- [x] `SAVE_SETTINGS` called (fire and forget) on "Done"
- [x] Advanced settings link opens web app settings page in new tab

## Out of Scope

- More than two language options per field
- Per-video language overrides
- UI language localization (extension UI is always in Chinese/English mix)
