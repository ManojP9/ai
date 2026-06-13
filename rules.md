# Project Rules

Working guidelines for everyone (human or AI) editing this project. Adapted from the
**Karpathy Guidelines** — behavioral rules derived from Andrej Karpathy's observations on
common LLM coding mistakes. They favor caution over speed and apply to writing, reviewing,
and refactoring code.

> Source: https://github.com/multica-ai/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md

Every directory in this project carries its own `rules.md` with a description of what that
folder is for. This root file is the canonical, full version of the guidelines.

---

## 1. Think Before Coding

Clarity and transparency before implementation:

- State assumptions explicitly rather than proceeding with uncertainty.
- Present multiple interpretations if they exist — avoid silent decisions.
- Suggest simpler alternatives when available, and push back appropriately.
- Stop and articulate confusion rather than charging forward.

## 2. Simplicity First

Deliver the minimal code that addresses the actual request:

- Exclude features beyond the specification.
- Avoid single-use abstractions.
- Skip unrequested flexibility or configurability.
- Don't handle impossible error scenarios.
- Simplify if the solution exceeds reasonable complexity.

The standard: *"Would a senior engineer find this overcomplicated?"* If yes, reduce it.

## 3. Surgical Changes

Make targeted modifications only:

- Don't alter adjacent code, formatting, or comments.
- Avoid refactoring code that already works.
- Match existing style conventions.
- Flag unrelated dead code — don't remove it unless explicitly asked.
- Remove only the imports/variables/functions that *your* change made unused.

The test: every changed line should connect directly to the request.

## 4. Goal-Driven Execution

Turn tasks into measurable success criteria:

- Convert vague requests into testable outcomes.
- State a brief multi-step plan with verification checkpoints.
- Write tests that reproduce a problem before fixing it.
- Make the success criteria strong enough to solve the problem independently.

---

## Project context

**3C Foods** — an AI-powered food recommendation app (Next.js 15 App Router, Claude,
Neon Postgres, Stripe, NextAuth). The repo doubles as an Obsidian "LLM Wiki" vault:
`raw/` (immutable sources), Phase folders (living task notes), and `wiki/` (synthesis).
See `README.md` for the product overview and `CLAUDE.md` for the vault schema.
