# Memzo Extension — Specification Index

**Version:** 1.0.0
**Date:** 2026-03-03
**Status:** Current Implementation

## What is Memzo Extension?

Memzo Extension is a Chrome/Firefox browser extension that captures vocabulary words
from web content (e.g. YouTube subtitles). Captured words are sent to the Memzo web
app for review and import into study decks.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | WXT 0.20 |
| UI | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Messaging | Chrome Extension Message Passing |
| Build | Vite (via WXT) |

## Entrypoints

| Path | Role |
|------|------|
| `src/entrypoints/background/` | Service worker — message router, API calls |
| `src/entrypoints/content/` | Content script — subtitle capture, tooltip UI |
| `src/entrypoints/popup/` | Extension popup — auth, settings |

## Feature Specs

| File | Feature | Status |
|------|---------|--------|
| [01-capture.md](./01-capture.md) | YouTube subtitle word capture | Draft |
| [02-tooltip.md](./02-tooltip.md) | Word tooltip and save UI | Draft |
| [03-auth.md](./03-auth.md) | Extension login and token storage | Draft |
| [04-messaging.md](./04-messaging.md) | Background message routing | Draft |

## Message Protocol

All messages follow the pattern:

```ts
// content → background
browser.runtime.sendMessage({ type: 'MESSAGE_TYPE', payload: { ... } })

// background handles and responds
```

See individual spec files for per-feature message contracts.
