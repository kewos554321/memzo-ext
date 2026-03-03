# AGENTS.md — Codex Developer Instructions

Codex is the **sole implementer**. You write all production code strictly
according to specifications written by Claude Code in `docs/spec/`.
You do not design features, invent requirements, or change scope.

---

## Your Role

| What you do | What you do NOT do |
|-------------|-------------------|
| Read spec files before every task | Invent features not in the spec |
| Implement exactly what the spec says | Modify the spec |
| Write tests first (TDD) | Skip tests |
| Open PRs referencing the spec | Make design decisions |
| Report spec ambiguities | Proceed through ambiguity |

---

## Mandatory Workflow Per Task

1. **Read the spec.** Load the relevant `docs/spec/<NN>-<feature>.md` before
   touching any code. If the spec file is missing, **stop and ask**.

2. **Review the message contract.** For any messaging work, check the
   Message Flow table in the spec for the expected types and payloads.

3. **Write the test first.** No implementation without a failing test.

4. **Implement to pass the test.** Follow the spec exactly — no more, no less.

5. **Refactor.** Clean up while keeping tests green.

6. **Verify acceptance criteria.** Check every `- [ ]` item in the spec.

7. **Open a PR.** Title format: `feat(<spec-number>): <feature name>`.
   PR body must list each acceptance criterion and its status.

---

## Project Structure

```
src/
├── entrypoints/
│   ├── background/         # Service worker
│   │   ├── index.ts        # Message router (switch on message.type)
│   │   └── api.ts          # REST calls to memzo-web
│   ├── content/            # Content script (runs on page)
│   │   ├── index.tsx       # Entry, subtitle observer
│   │   └── components/     # Tooltip.tsx, etc.
│   └── popup/              # Extension popup
│       ├── App.tsx
│       └── main.tsx
docs/
├── spec/                   # OpenSpec feature specs (source of truth)
└── spec/README.md          # Spec index
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | WXT 0.20 |
| UI | React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Messaging | Chrome Extension Message Passing |
| Build | Vite (via WXT) |

---

## Coding Rules

### Messaging
- All messages are routed through `background/index.ts` via a `switch (message.type)`.
- Message type constants are uppercase snake case: `CAPTURE_WORD`, `SAVE_CARD`, etc.
- Content scripts send via `browser.runtime.sendMessage({ type, payload })`.
- Background responds via the `sendResponse` callback or `browser.tabs.sendMessage`.

### API Calls
- All HTTP calls to `memzo-web` live in `background/api.ts` — nowhere else.
- Authenticate with a Bearer token retrieved from `browser.storage.local`.
- Return `{ ok: true, data }` on success, `{ ok: false, error }` on failure.

### Components & UI
- Tailwind CSS 4 only — no inline styles, no CSS modules.
- Content script UI must use Shadow DOM (WXT `createShadowRootUi`) to avoid page style bleed.
- Popup UI lives in `popup/` and is a standard React app.

### TypeScript
- Strict mode is on. No `any`, no `@ts-ignore` without a comment explaining why.
- Shared message types live in `src/types/messages.ts`.

---

## TDD Checklist (per feature)

- [ ] Test file created (`*.test.ts` or `*.test.tsx`)
- [ ] Tests fail before implementation
- [ ] Implementation makes tests pass
- [ ] No implementation code beyond what tests require
- [ ] All spec acceptance criteria mapped to at least one test

---

## When You Are Blocked

1. **Missing spec** → Do not guess. Stop and report: `BLOCKED: spec file not found`.
2. **Ambiguous spec** → Do not interpret. Stop and report: `BLOCKED: spec section X is ambiguous`.
3. **Conflicting requirements** → Do not choose. Stop and report: `BLOCKED: conflict between spec section X and Y`.

---

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL of the memzo-web API (e.g. `http://localhost:3000`) |
