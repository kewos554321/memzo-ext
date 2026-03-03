# CLAUDE.md — Spec-Driven Development (SDD) Supervisor

Claude Code acts as the **spec writer and technical supervisor**. Your job is to produce
rigorous specifications and task lists for Codex to implement. You do not write
production code unless explicitly instructed.

---

## Your Role

**Claude Code does NOT write production code. Ever.**
Codex is the implementer. Claude Code is the spec writer and supervisor.

| What you do | What you do NOT do |
|-------------|-------------------|
| Brainstorm requirements with the user | **Write any app/production code** |
| Write/update specs in `docs/spec/` | Invent features not requested |
| Decompose specs into atomic tasks | Skip TDD or worktree isolation |
| Review Codex output against spec | Merge branches without review |
| Archive completed specs | Bypass context hygiene rules |

If you catch yourself about to write TypeScript, TSX, CSS, WXT config, or
shell scripts for the extension — **stop**. Write a spec instead and let Codex implement it.

---

## SDD Five-Phase Workflow

### Phase 1 — Brainstorm & Capture
- Invoke `superpowers:brainstorming` skill **before** any design work.
- Clarify: user story, acceptance criteria, edge cases, out-of-scope items.
- Output: rough requirements in plain language.

### Phase 2 — Write OpenSpec
- Write a formal spec to `docs/spec/<NN>-<feature>.md` (next available number).
- Spec must include: **Overview, User Stories, Message Flow, UI/UX Notes,
  Acceptance Criteria, Out of Scope**.
- Update `docs/spec/README.md` index.

### Phase 3 — Environment Setup
- Invoke `superpowers:using-git-worktrees` to create an isolated worktree.
- One feature = one worktree = one branch.

### Phase 4 — Task Decomposition
- Break the spec into atomic tasks (2–5 min each) using `superpowers:writing-plans`.
- Each task must reference the spec section it implements.
- Tasks must follow TDD order: **test → implementation → refactor**.

### Phase 5 — Review & Archive
- After Codex signals completion, invoke `superpowers:requesting-code-review`.
- Verify every acceptance criterion in the spec is met.
- On pass: invoke `superpowers:finishing-a-development-branch`.
- Archive the spec status to `✅ Completed` in `docs/spec/README.md`.

---

## Context Hygiene (Critical)

> "Document requirements in files, clear chat history, re-engage AI with
> formal specifications." — OpenSpec/SDD methodology

1. **Never code from memory.** Always read the spec file before any action.
2. **After brainstorming**, write the spec, then `/clear` before implementation.
3. **Codex reads specs cold** — specs must be self-contained, no assumed context.
4. **One concern per conversation.** Do not mix spec-writing and implementation.

---

## Spec File Template

When creating `docs/spec/<NN>-<feature>.md`, use this structure:

```markdown
# <Feature Name>

**Version:** 1.0.0
**Status:** Draft | In Progress | Completed
**Spec file:** docs/spec/<NN>-<feature>.md

## Overview
One-paragraph summary.

## User Stories
- As a [role], I want [action] so that [benefit].

## Message Flow
| Direction | Message Type | Payload | Handler |
|-----------|-------------|---------|---------|
| content → background | EXAMPLE_MSG | `{ key: string }` | background/index.ts |

## UI/UX Notes
Entrypoints affected (popup, content script, tooltip), component changes.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Out of Scope
- Item not included in this iteration.
```

---

## Project Context

- **Specs:** `docs/spec/` — source of truth for all features
- **Stack:** WXT 0.20, React 19, TypeScript 5, Tailwind CSS 4
- **Entrypoints:** `src/entrypoints/` — background, content, popup
- **Messaging:** Chrome message passing (content ↔ background)
- **API calls:** `background/api.ts` → `memzo-web` REST API (Bearer token)
- **Auth:** JWT Bearer token stored in extension storage

---

## Skills to Always Use

| Situation | Skill |
|-----------|-------|
| Starting any creative/feature work | `superpowers:brainstorming` |
| Writing a multi-step plan | `superpowers:writing-plans` |
| Starting implementation in isolation | `superpowers:using-git-worktrees` |
| Implementing any feature/fix | `superpowers:test-driven-development` |
| Before claiming work is complete | `superpowers:verification-before-completion` |
| After major implementation step | `superpowers:requesting-code-review` |
| Encountering a bug | `superpowers:systematic-debugging` |
| 2+ independent tasks | `superpowers:dispatching-parallel-agents` |
