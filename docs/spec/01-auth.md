# Auth — Extension Login & Token Storage

**Version:** 1.0.0
**Status:** Completed
**Spec file:** docs/spec/01-auth.md

## Overview

Users log in to Memzo from the extension popup using email and password. A JWT token is
returned from the web API and stored in `browser.storage.local`. All subsequent API calls
attach this token as a Bearer header. A 401 response automatically clears the token and
forces re-login. Logout clears all session data from storage.

## User Stories

- As a user, I want to log in from the extension popup so that my captured words are saved to my account.
- As a user, I want to stay logged in across browser sessions so that I don't need to re-authenticate every time.
- As a user, I want to log out so that my session is cleared from this browser.
- As the system, I want to auto-clear expired tokens on 401 so that the user is not stuck in a broken state.

## Message Flow

| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| popup → background | `GET_AUTH_STATE` | — | `background/index.ts` |
| popup → background | `LOGIN` | `{ email: string; password: string }` | `background/index.ts` |
| popup → background | `LOGOUT` | — | `background/index.ts` |

### API Calls (background/api.ts)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/ext/auth/token` | `{ email, password }` | `{ token: string; user: SessionUser }` |

### Storage Keys

| Key | Value | Cleared on logout |
|-----|-------|-------------------|
| `memzo_token` | JWT string | ✅ |
| `memzo_user` | `SessionUser` JSON | ✅ |
| `memzo_selected_deck` | deck ID string | ✅ |

## UI/UX Notes

**Popup — Unauthenticated (`LoginForm.tsx`)**
- Email + password inputs with autocomplete hints
- Submit button disabled while request is in flight
- Error message displayed inline on failure
- Sign-up link opens `memzo.vercel.app/register` in a new tab
- Clay card theme (teal/cyan palette)

**Popup — Authenticated (`ConnectedState.tsx`)**
- Green "Connected" badge
- User avatar (initials), name, email
- Current CEFR level pill (or prompt to open YouTube if not set)
- "Open Memzo →" button → opens web app in new tab
- "登出" button triggers LOGOUT

## Acceptance Criteria

- [x] `POST /api/ext/auth/token` is called with email + password
- [x] Token and user are saved to `browser.storage.local` on success
- [x] `GET_AUTH_STATE` returns `{ user, token }` from storage
- [x] 401 response in `authFetch` clears token from storage
- [x] `LOGOUT` clears token, user, and selected deck from storage
- [x] Popup shows `LoginForm` when unauthenticated, `ConnectedState` when authenticated
- [x] Loading spinner shown while `GET_AUTH_STATE` resolves on mount

## Out of Scope

- OAuth / social login
- Token refresh flow (server handles 30-day expiry)
- Multi-account support
