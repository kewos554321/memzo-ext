# Level System — CEFR Placement Test & Learning Zone

**Version:** 1.0.0
**Status:** Completed
**Spec file:** docs/spec/04-level-system.md

## Overview

The extension determines the user's vocabulary level per target language using a placement
test or manual selection. English uses the CEFR framework (A1–C2); Traditional Chinese
uses HSK levels mapped to CEFR tiers. The user's level determines the "learning zone" —
words at the user's level and one level above are highlighted in green in the subtitle
overlay, making it easy to spot words worth learning.

## User Stories

- As a user, I want to take a quick placement test so that the extension highlights words appropriate for my level.
- As a user, I want to manually select my level so that I can skip the test.
- As a user, I want to see only words at my level highlighted so that I'm not overwhelmed by too many or too few words.
- As a user, I want to retake the placement test from settings so that my level updates as I improve.

## Message Flow

| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| content → background | `GET_SETTINGS` | — | `background/index.ts` |
| content → background | `SAVE_SETTINGS` | `{ nativeLang?, targetLang?, userLevels?: Record<string, string> }` | `background/index.ts` |

### API Calls (background/api.ts)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/ext/settings` | — | `{ nativeLang, targetLang, userLevels? }` |
| PATCH | `/api/ext/settings` | `{ nativeLang?, targetLang?, userLevels? }` | — |

### Storage Keys

| Key | Value |
|-----|-------|
| `memzo_user_level_{lang}` | `CEFRLevel` string (e.g. `"B1"`) |

## Difficulty System

### English (CEFR)
- Word lists: A1, A2, B1, B2, C1 Sets built from `en-words.ts`
- `getLevel(word)`: normalizes → lowercase, strips non-letters, handles hyphens
- `isInLearningZone(wordLevel, userLevel)`: `wordIdx >= userIdx && wordIdx <= userIdx + 1`

### Traditional Chinese (HSK → CEFR)
| HSK Level | CEFR Tier |
|-----------|-----------|
| HSK 1–2 | A1–A2 |
| HSK 3–4 | B1–B2 |
| HSK 5–6 | C1–C2 |

## Placement Test Algorithm

1. Show words for each CEFR level (8 words per level, 6 levels total)
2. User clicks known words
3. **Result:** highest level where user knows ≥ 5/8 (62.5%) of words
4. If no difficulty data for language → ManualSelect fallback

## UI/UX Notes

**LevelTestDialog (content script overlay)**
- Triggered automatically on first YouTube video if no level set
- View 1 — Intro: stats (total words, groups, ~30 sec), "開始" / "稍後再說"
- View 2 — WordSelectView:
  - Header: level badge + step indicator (e.g. 1/6)
  - Progress dots
  - 8 word pills per level, user clicks to mark known
  - Footer: selected count + "下一組 →" / "完成 ✓"
- View 3 — ResultView:
  - Large result level display
  - Fine-tune grid of 6 level buttons
  - "開始學習 →" → saves level to storage + server

**SettingsPanel — Level section**
- Read-only level display (e.g. "A2 · CEFR")
- "重新測試" button → opens LevelTestDialog overlay

**ConnectedState (popup)**
- Level pill shown next to user name
- Prompt shown if level not yet set: "打開 YouTube 影片，Memzo 會自動引導你完成程度測試。"
- Watches storage for live level updates (re-renders when test completes on YouTube)

## Acceptance Criteria

- [x] `LevelTestDialog` appears automatically on YouTube if no level set for target language
- [x] Test cycles through 6 CEFR levels, 8 words each
- [x] Level calculated as highest level with ≥ 62.5% known words
- [x] `ManualSelect` fallback shown if no difficulty data for language
- [x] Level saved to `memzo_user_level_{lang}` in local storage
- [x] Level synced to server via `SAVE_SETTINGS`
- [x] `isInLearningZone` used by `WordSpan` to determine green highlight
- [x] Words outside learning zone rendered without color highlight
- [x] "重新測試" in SettingsPanel re-opens the dialog
- [x] Popup ConnectedState reflects current level from storage in real time

## Out of Scope

- Adaptive level adjustment based on ongoing study performance
- Per-video difficulty overrides
- Level history / progression tracking
